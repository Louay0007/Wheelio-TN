import { eq, sql } from "drizzle-orm"
import { z } from "zod"
import {
  bookings,
  ledgerAccounts,
  ledgerEntries,
  ledgerTransactions,
  paymentIntents,
  paymentTransactions,
  payoutBatches,
  payoutItems,
} from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import {
  conflict,
  forbidden,
  notFound,
  validationError,
} from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import {
  assertBalancedEntries,
  buildPayAtAgencyCommissionEntries,
  type LedgerEntryInput,
} from "@/server/modules/finance/domain/ledger"
import { agencySettlementPosition } from "@/server/modules/pricing/domain/quote-money"
import { getPaymentProvider } from "@/server/modules/finance/application/payment-provider"

async function ensureAccount(
  tx: Parameters<Parameters<typeof withTransaction>[1]>[0],
  code: string,
  accountClass: string,
  ownerType: string,
  ownerId?: string | null,
) {
  const existing = await tx.query.ledgerAccounts.findFirst({
    where: eq(ledgerAccounts.code, code),
  })
  if (existing) return existing.id
  const id = createId("lac")
  await tx.insert(ledgerAccounts).values({
    id,
    code,
    ownerType,
    ownerId: ownerId ?? null,
    accountClass,
  })
  return id
}

export async function postLedgerTransaction(
  draft: {
    type: string
    bookingId?: string
    description: string
    idempotencyKey: string
    entries: LedgerEntryInput[]
  },
  opts?: { tx?: Parameters<Parameters<typeof withTransaction>[1]>[0] },
) {
  assertBalancedEntries(draft.entries)
  const run = async (tx: Parameters<Parameters<typeof withTransaction>[1]>[0]) => {
    const existing = await tx.query.ledgerTransactions.findFirst({
      where: eq(ledgerTransactions.idempotencyKey, draft.idempotencyKey),
    })
    if (existing) {
      return { transactionId: existing.id, replayed: true as const }
    }

    const transactionId = createId("ltx")
    await tx.insert(ledgerTransactions).values({
      id: transactionId,
      type: draft.type,
      bookingId: draft.bookingId,
      description: draft.description,
      idempotencyKey: draft.idempotencyKey,
    })

    for (const entry of draft.entries) {
      const accountId = await ensureAccount(
        tx,
        entry.accountCode,
        entry.accountCode.includes("deposit") ? "liability" : "operating",
        entry.accountCode.startsWith("agency.") ? "agency" : "platform",
      )
      await tx.insert(ledgerEntries).values({
        id: createId("len"),
        transactionId,
        accountId,
        debitMillimes: entry.debitMillimes ?? BigInt(0),
        creditMillimes: entry.creditMillimes ?? BigInt(0),
      })
    }
    return { transactionId, replayed: false as const }
  }
  if (opts?.tx) return run(opts.tx)
  return withTransaction(getDb(), run)
}

export async function createPaymentIntent(
  principal: EffectivePrincipal | null,
  bookingId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal?.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot create payment intents",
    )
  }
  const schema = z.object({
    purpose: z.enum(["rental", "modification"]).default("rental"),
    idempotencyKey: z.string().min(8).max(120).optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid payment intent", {
      issues: parsed.error.issues,
    })
  }

  const provider = await getPaymentProvider()
  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: { snapshot: true },
    })
    if (!booking || !booking.snapshot) throw notFound("Booking not found")
    if (booking.customerProfileId) {
      if (
        principal?.actorClass !== "customer" ||
        booking.customerProfileId !== principal.customerProfileId
      ) {
        throw forbidden("TENANT_SCOPE_VIOLATION", "Booking ownership mismatch")
      }
    } else if (principal) {
      throw forbidden("TENANT_SCOPE_VIOLATION", "Guest booking ownership mismatch")
    }
    if (booking.paymentMode === "pay_at_agency") {
      // Online intent is not required; commission receivable posted at confirmation.
      return {
        intentId: null as string | null,
        status: "not_required" as const,
        amountMillimes: "0",
        note: "Pay-at-agency bookings do not create rental payment intents",
      }
    }

    if (parsed.data.idempotencyKey) {
      const existing = await tx.query.paymentIntents.findFirst({
        where: eq(paymentIntents.idempotencyKey, parsed.data.idempotencyKey),
      })
      if (existing) {
        return {
          intentId: existing.id,
          status: existing.status,
          amountMillimes: existing.amountMillimes.toString(),
          provider: existing.provider,
          replayed: true as const,
        }
      }
    }

    // Online due comes from commissionable path — deposit never charged here.
    const amount = booking.snapshot.commissionableMillimes
    const intentId = createId("pi")
    await tx.insert(paymentIntents).values({
      id: intentId,
      bookingId,
      purpose: parsed.data.purpose,
      amountMillimes: amount,
      status: "requires_action",
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      idempotencyKey: parsed.data.idempotencyKey ?? null,
      provider: provider.name,
      providerReference: `${provider.name}_${intentId}`,
    })

    await recordAudit(
      tx,
      {
        action: "payment.intent_created",
        resourceType: "payment_intent",
        resourceId: intentId,
        tenantType: "agency",
        tenantId: booking.agencyId,
        after: { amountMillimes: amount.toString(), purpose: parsed.data.purpose },
      },
      ctx,
      principal ?? undefined,
    )
    await enqueueOutbox(tx, {
      aggregateType: "payment_intent",
      aggregateId: intentId,
      eventType: "payment.intent_created",
      payload: { intentId, bookingId, amountMillimes: amount.toString() },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      intentId,
      status: "requires_action" as const,
      amountMillimes: amount.toString(),
      currency: "TND" as const,
      provider: provider.name,
      clientSecret: provider.createClientSecret(intentId, amount.toString()),
      // Deposit is never part of this intent amount.
      includesDeposit: false as const,
    }
  })
}

export async function handlePaymentWebhook(
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    providerTransactionId: z.string().min(1),
    intentId: z.string().min(1),
    type: z.enum(["capture", "refund", "fail"]),
    amountMillimes: z.string().regex(/^\d+$/),
    status: z.enum(["succeeded", "failed"]),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid webhook payload", {
      issues: parsed.error.issues,
    })
  }

  return withTransaction(getDb(), async (tx) => {
    const existingTxn = await tx.query.paymentTransactions.findFirst({
      where: eq(
        paymentTransactions.providerTransactionId,
        parsed.data.providerTransactionId,
      ),
    })
    if (existingTxn) {
      return {
        transactionId: existingTxn.id,
        replayed: true as const,
        status: existingTxn.status,
      }
    }

    const intent = await tx.query.paymentIntents.findFirst({
      where: eq(paymentIntents.id, parsed.data.intentId),
    })
    if (!intent) throw notFound("Payment intent not found")

    const amount = BigInt(parsed.data.amountMillimes)
    if (amount !== intent.amountMillimes) {
      throw conflict("VERSION_CONFLICT", "Webhook amount does not match intent")
    }

    const transactionId = createId("ptx")
    await tx.insert(paymentTransactions).values({
      id: transactionId,
      intentId: intent.id,
      providerTransactionId: parsed.data.providerTransactionId,
      type: parsed.data.type,
      amountMillimes: amount,
      status: parsed.data.status,
      rawReceiptRef: `webhook:${ctx.requestId}`,
    })

    if (parsed.data.status === "succeeded" && parsed.data.type === "capture") {
      await tx
        .update(paymentIntents)
        .set({ status: "captured", updatedAt: new Date() })
        .where(eq(paymentIntents.id, intent.id))

      const booking = await tx.query.bookings.findFirst({
        where: eq(bookings.id, intent.bookingId),
        with: { snapshot: true },
      })
      if (booking?.snapshot) {
        // Wheelio collected for agency — deposit still excluded.
        await postLedgerTransaction(
          {
            type: "rental_capture",
            bookingId: booking.id,
            description: `Capture for ${booking.reference}`,
            idempotencyKey: `capture:${parsed.data.providerTransactionId}`,
            entries: [
              {
                accountCode: "wheelio.cash",
                debitMillimes: booking.snapshot.commissionableMillimes,
              },
              {
                accountCode: "agency.payable_net",
                creditMillimes: booking.snapshot.agencyNetMillimes,
              },
              {
                accountCode: "wheelio.commission_revenue",
                creditMillimes: booking.snapshot.commissionMillimes,
              },
            ],
          },
          { tx },
        )
      }
    }

    await enqueueOutbox(tx, {
      aggregateType: "payment_transaction",
      aggregateId: transactionId,
      eventType: "payment.webhook_processed",
      payload: {
        transactionId,
        intentId: intent.id,
        type: parsed.data.type,
        status: parsed.data.status,
      },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      transactionId,
      replayed: false as const,
      status: parsed.data.status,
    }
  })
}

/**
 * Build a payout batch from Wheelio-collected agency_net only.
 * Pay-at-agency bookings contribute commission receivable offset, never agency_net payout.
 * Deposit memos are never selected.
 */
export async function createPayoutBatch(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden("IMPERSONATION_READ_ONLY", "Impersonation cannot create payouts")
  }
  if (principal.actorClass !== "admin") {
    throw forbidden("FORBIDDEN", "Admin finance role required")
  }
  const schema = z.object({
    agencyId: z.string().min(1),
    periodStart: z.string().datetime({ offset: true }),
    periodEnd: z.string().datetime({ offset: true }),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid payout batch", {
      issues: parsed.error.issues,
    })
  }

  return withTransaction(getDb(), async (tx) => {
    const periodStart = new Date(parsed.data.periodStart)
    const periodEnd = new Date(parsed.data.periodEnd)

    // Only deposit_online / Wheelio-collected agency_net is payout-eligible.
    // Explicitly exclude deposit columns and pay_at_agency agency_net.
    const eligible = await tx.execute(sql`
      SELECT b.id AS booking_id,
             bs.agency_net_millimes AS agency_net,
             b.payment_mode AS payment_mode,
             bs.commission_millimes AS commission
      FROM bookings b
      INNER JOIN booking_snapshots bs ON bs.booking_id = b.id
      WHERE b.agency_id = ${parsed.data.agencyId}
        AND b.status IN ('confirmed','active','completed')
        AND b.completed_at IS NOT NULL
        AND b.completed_at >= ${periodStart}
        AND b.completed_at < ${periodEnd}
        AND b.payment_mode = 'deposit_online'
        AND NOT EXISTS (
          SELECT 1 FROM payout_items pi
          WHERE pi.source_type = 'booking_agency_net'
            AND pi.source_id = b.id
        )
    `)
    const rows = (
      (eligible as unknown as {
        rows?: Array<{
          booking_id: string
          agency_net: string | number | bigint
          payment_mode: string
          commission: string | number | bigint
        }>
      }).rows ??
      (Array.isArray(eligible)
        ? (eligible as unknown as Array<{
            booking_id: string
            agency_net: string | number | bigint
            payment_mode: string
            commission: string | number | bigint
          }>)
        : [])
    ) as Array<{
      booking_id: string
      agency_net: string | number | bigint
      payment_mode: string
      commission: string | number | bigint
    }>

    const payoutId = createId("payout")
    let total = BigInt(0)
    const items: Array<{
      bookingId: string
      amount: bigint
      sourceType: string
    }> = []

    for (const row of rows) {
      const amount = BigInt(row.agency_net)
      // Settlement guard: never pay agency_net for pay_at_agency (filtered above).
      const settlement = agencySettlementPosition({
        wheelioCollectedForAgency: amount,
        commission: BigInt(0),
      })
      if (settlement <= BigInt(0)) continue
      total += settlement
      items.push({
        bookingId: row.booking_id,
        amount: settlement,
        sourceType: "booking_agency_net",
      })
    }

    // Pay-at-agency commission receivable/offset — no agency_net payout item.
    const paa = await tx.execute(sql`
      SELECT b.id AS booking_id, bs.commission_millimes AS commission
      FROM bookings b
      INNER JOIN booking_snapshots bs ON bs.booking_id = b.id
      WHERE b.agency_id = ${parsed.data.agencyId}
        AND b.payment_mode = 'pay_at_agency'
        AND b.status IN ('confirmed','active','completed')
        AND b.completed_at IS NOT NULL
        AND b.completed_at >= ${periodStart}
        AND b.completed_at < ${periodEnd}
    `)
    const paaRows = (
      (paa as unknown as {
        rows?: Array<{ booking_id: string; commission: string | number | bigint }>
      }).rows ??
      (Array.isArray(paa)
        ? (paa as unknown as Array<{
            booking_id: string
            commission: string | number | bigint
          }>)
        : [])
    ) as Array<{ booking_id: string; commission: string | number | bigint }>

    for (const row of paaRows) {
      const commission = BigInt(row.commission)
      await postLedgerTransaction(
        {
          type: "pay_at_agency_commission",
          bookingId: row.booking_id,
          description: `Pay-at-agency commission for ${row.booking_id}`,
          idempotencyKey: `paa-commission:${row.booking_id}:${payoutId}`,
          entries: buildPayAtAgencyCommissionEntries({
            commissionMillimes: commission,
          }),
        },
        { tx },
      )
    }

    await tx.insert(payoutBatches).values({
      id: payoutId,
      agencyId: parsed.data.agencyId,
      periodStart,
      periodEnd,
      status: "draft",
      totalMillimes: total,
    })

    for (const item of items) {
      await tx.insert(payoutItems).values({
        id: createId("poi"),
        payoutId,
        bookingId: item.bookingId,
        sourceType: item.sourceType,
        sourceId: item.bookingId,
        amountMillimes: item.amount,
        includesDeposit: false,
      })
    }

    await recordAudit(
      tx,
      {
        action: "payout.batch_created",
        resourceType: "payout_batch",
        resourceId: payoutId,
        tenantType: "agency",
        tenantId: parsed.data.agencyId,
        after: {
          totalMillimes: total.toString(),
          itemCount: items.length,
          includesDeposit: false,
        },
      },
      ctx,
      principal,
    )

    return {
      payoutId,
      agencyId: parsed.data.agencyId,
      totalMillimes: total.toString(),
      itemCount: items.length,
      includesDeposit: false as const,
      payAtAgencyCommissionBookings: paaRows.length,
      status: "draft" as const,
    }
  })
}

export async function confirmStubPayment(
  principal: EffectivePrincipal,
  intentId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot confirm payments",
    )
  }
  if (principal.actorClass !== "customer" || !principal.customerProfileId) {
    throw forbidden("FORBIDDEN", "Only the booking customer can confirm payments")
  }
  const schema = z.object({
    clientSecret: z.string().min(10),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid confirm payload", {
      issues: parsed.error.issues,
    })
  }

  const intent = await getDb().query.paymentIntents.findFirst({
    where: eq(paymentIntents.id, intentId),
    with: { booking: true },
  })
  if (!intent) throw notFound("Payment intent not found")
  if (intent.booking.customerProfileId !== principal.customerProfileId) {
    throw forbidden("TENANT_SCOPE_VIOLATION", "Payment intent ownership mismatch")
  }

  const provider = await getPaymentProvider()
  return provider.confirm({ intentId: intent.id, amountMillimes: intent.amountMillimes.toString(), clientSecret: parsed.data.clientSecret }, ctx)
}

export async function listPayoutEligibleQuery(agencyId: string) {
  // Canonical deposit-absent payout eligibility probe for tests/admin.
  const db = getDb()
  const result = await db.execute(sql`
    SELECT b.id,
           bs.agency_net_millimes,
           bs.deposit_millimes,
           b.payment_mode
    FROM bookings b
    INNER JOIN booking_snapshots bs ON bs.booking_id = b.id
    WHERE b.agency_id = ${agencyId}
      AND b.payment_mode = 'deposit_online'
      AND bs.deposit_millimes IS NOT NULL
  `)
  const rows =
    (result as unknown as {
      rows?: Array<{
        id: string
        agency_net_millimes: string
        deposit_millimes: string
        payment_mode: string
      }>
    }).rows ?? []
  return rows.map((row) => ({
    bookingId: row.id,
    agencyNetMillimes: String(row.agency_net_millimes),
    // Exposed for assertion only — never summed into payout totals.
    depositMillimesMemo: String(row.deposit_millimes),
    paymentMode: row.payment_mode,
    payoutUsesDeposit: false as const,
  }))
}
