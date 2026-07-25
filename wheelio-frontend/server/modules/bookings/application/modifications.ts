import { and, eq, sql } from "drizzle-orm"
import { z } from "zod"
import {
  bookingModificationRequests,
  bookingSnapshots,
  bookingStatusHistory,
  bookings,
  ratePlans,
  vehiclePools,
} from "@/db/schema"
import { agencies } from "@/db/schema/catalog"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import {
  type DbTransaction,
  withTransaction,
} from "@/server/core/database/transaction"
import {
  conflict,
  forbidden,
  notFound,
  validationError,
} from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import { buildQuoteBreakdown } from "@/server/modules/pricing/domain/quote-money"

const modificationQuoteSchema = z.object({
  pickupAt: z.string().datetime({ offset: true }).optional(),
  returnAt: z.string().datetime({ offset: true }).optional(),
  driverFullName: z.string().min(1).max(120).optional(),
  extrasMillimes: z.string().regex(/^\d+$/).optional(),
})

async function loadOwnedBooking(
  principal: EffectivePrincipal | null,
  bookingId: string,
) {
  const booking = await getDb().query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: { snapshot: true },
  })
  if (!booking) throw notFound("Booking not found")
  if (principal?.actorClass === "customer" && principal.customerProfileId) {
    if (booking.customerProfileId !== principal.customerProfileId) {
      throw forbidden(
        "TENANT_SCOPE_VIOLATION",
        "Booking belongs to another customer",
      )
    }
  }
  return booking
}

export async function createModificationQuote(
  principal: EffectivePrincipal | null,
  bookingId: string,
  rawInput: unknown,
) {
  if (principal?.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot create modification quotes",
    )
  }
  const parsed = modificationQuoteSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid modification quote", {
      issues: parsed.error.issues,
    })
  }
  const booking = await loadOwnedBooking(principal, bookingId)
  if (!["requested", "confirmed", "held", "payment_pending"].includes(booking.status)) {
    throw conflict(
      "ILLEGAL_STATE_TRANSITION",
      `Cannot modify booking in status ${booking.status}`,
    )
  }

  const db = getDb()
  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.id, booking.agencyId),
  })
  if (!agency) throw notFound("Agency not found")

  const pickupAt = parsed.data.pickupAt
    ? new Date(parsed.data.pickupAt)
    : booking.pickupAt
  const returnAt = parsed.data.returnAt
    ? new Date(parsed.data.returnAt)
    : booking.returnAt
  if (returnAt <= pickupAt) {
    throw validationError("Return must be after pickup")
  }

  const plan = await db.query.ratePlans.findFirst({
    where: and(
      eq(ratePlans.agencyId, booking.agencyId),
      eq(ratePlans.active, true),
    ),
  })
  const days = Math.max(
    plan?.minimumDays ?? 1,
    Math.ceil((returnAt.getTime() - pickupAt.getTime()) / (1000 * 60 * 60 * 24)),
  )
  const rental =
    (plan?.netDailyMillimes ?? BigInt(95_000)) * BigInt(days)
  const extras = parsed.data.extrasMillimes
    ? BigInt(parsed.data.extrasMillimes)
    : BigInt(0)
  const breakdown = buildQuoteBreakdown({
    rentalMillimes: rental,
    mandatoryFeesMillimes: BigInt(0),
    extrasMillimes: extras,
    depositMillimes: booking.snapshot?.depositMillimes ?? BigInt(500_000),
    commissionRateBps: agency.commissionTierBps,
    paymentMode:
      booking.paymentMode === "deposit_online"
        ? "deposit_online"
        : "pay_at_agency",
  })

  const currentCommissionable = booking.snapshot?.commissionableMillimes ?? BigInt(0)
  const nextCommissionable = BigInt(breakdown.commissionable.amountMillimes)
  const priceDifference = nextCommissionable - currentCommissionable

  const modificationQuoteId = createId("modq")
  return {
    modificationQuoteId,
    bookingId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    proposed: {
      pickupAt: pickupAt.toISOString(),
      returnAt: returnAt.toISOString(),
      driverFullName: parsed.data.driverFullName ?? null,
      pricing: breakdown,
    },
    priceDifference: {
      amountMillimes: priceDifference.toString(),
      currency: "TND" as const,
    },
    // Deposit stays out of commercial delta.
    depositDifference: {
      amountMillimes: "0",
      currency: "TND" as const,
    },
  }
}

export async function applyModification(
  principal: EffectivePrincipal | null,
  bookingId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal?.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot apply modifications",
    )
  }
  const schema = z.object({
    modificationQuoteId: z.string().min(1),
    expectedVersion: z.number().int().positive(),
    proposed: z.object({
      pickupAt: z.string().datetime({ offset: true }),
      returnAt: z.string().datetime({ offset: true }),
      driverFullName: z.string().nullable().optional(),
      pricing: z.record(z.string(), z.unknown()),
    }),
    priceDifferenceMillimes: z.string().regex(/^-?\d+$/),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid modification payload", {
      issues: parsed.error.issues,
    })
  }

  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: { snapshot: true },
    })
    if (!booking) throw notFound("Booking not found")
    if (principal?.actorClass === "customer" && principal.customerProfileId) {
      if (booking.customerProfileId !== principal.customerProfileId) {
        throw forbidden("TENANT_SCOPE_VIOLATION", "Booking ownership mismatch")
      }
    }
    if (booking.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Booking version mismatch")
    }

    const pickupAt = new Date(parsed.data.proposed.pickupAt)
    const returnAt = new Date(parsed.data.proposed.returnAt)
    const requestId = createId("modr")

    await tx.insert(bookingModificationRequests).values({
      id: requestId,
      bookingId,
      proposedSnapshot: parsed.data.proposed,
      priceDifferenceMillimes: BigInt(parsed.data.priceDifferenceMillimes),
      depositDifferenceMillimes: BigInt(0),
      status: "applied",
      expiresAt: new Date(Date.now() + 1000 * 60),
      actorUserId: principal?.actorUserId ?? null,
      decision: "auto_applied",
      decidedAt: new Date(),
    })

    await tx
      .update(bookings)
      .set({
        pickupAt,
        returnAt,
        version: booking.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))

    if (booking.snapshot) {
      const pricing = parsed.data.proposed.pricing as {
        commissionable?: { amountMillimes?: string }
        commission?: { amountMillimes?: string }
        agencyNet?: { amountMillimes?: string }
        deposit?: { amountMillimes?: string }
      }
      await tx
        .update(bookingSnapshots)
        .set({
          payloadJson: {
            ...booking.snapshot.payloadJson,
            modification: parsed.data.proposed,
          },
          commissionableMillimes: BigInt(
            pricing.commissionable?.amountMillimes ??
              booking.snapshot.commissionableMillimes.toString(),
          ),
          commissionMillimes: BigInt(
            pricing.commission?.amountMillimes ??
              booking.snapshot.commissionMillimes.toString(),
          ),
          agencyNetMillimes: BigInt(
            pricing.agencyNet?.amountMillimes ??
              booking.snapshot.agencyNetMillimes.toString(),
          ),
          // Deposit memo unchanged unless explicitly handled elsewhere.
          depositMillimes: booking.snapshot.depositMillimes,
        })
        .where(eq(bookingSnapshots.bookingId, bookingId))
    }

    await tx.insert(bookingStatusHistory).values({
      id: createId("bhist"),
      bookingId,
      fromStatus: booking.status,
      toStatus: booking.status,
      actorUserId: principal?.actorUserId ?? null,
      effectiveUserId: principal?.effectiveUserId ?? null,
      reasonCode: "customer_modification",
      source: "api",
      requestId: ctx.requestId,
    })

    await recordAudit(
      tx,
      {
        action: "booking.modified",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "agency",
        tenantId: booking.agencyId,
        after: parsed.data.proposed,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "booking.modified",
      payload: {
        bookingId,
        priceDifferenceMillimes: parsed.data.priceDifferenceMillimes,
      },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      bookingId,
      modificationRequestId: requestId,
      status: "applied" as const,
      version: booking.version + 1,
    }
  })
}

/**
 * Lock pool row and ensure overlapping held/confirmed/active allocations
 * do not exceed capacity. Used before creating category-level holds.
 * Pass `tx` when already inside a booking/hold transaction so the FOR UPDATE
 * lock is held until that outer transaction commits.
 */
export async function assertPoolCapacity(
  agencyId: string,
  categoryCode: string,
  start: Date,
  end: Date,
  opts?: { poolId?: string; tx?: DbTransaction },
) {
  const run = async (tx: DbTransaction) => {
    const pool = opts?.poolId
      ? await tx.query.vehiclePools.findFirst({
          where: and(
            eq(vehiclePools.id, opts.poolId),
            eq(vehiclePools.agencyId, agencyId),
            eq(vehiclePools.active, true),
          ),
        })
      : await tx.query.vehiclePools.findFirst({
          where: and(
            eq(vehiclePools.agencyId, agencyId),
            eq(vehiclePools.categoryCode, categoryCode),
            eq(vehiclePools.active, true),
          ),
        })

    if (!pool) {
      // No pool configured — physical vehicle GiST remains the guardrail.
      return {
        poolId: null as string | null,
        capacity: null as number | null,
        used: 0,
      }
    }

    await tx.execute(
      sql`SELECT id FROM vehicle_pools WHERE id = ${pool.id} FOR UPDATE`,
    )

    const usedResult = await tx.execute(sql`
      SELECT count(*)::int AS used
      FROM inventory_allocations
      WHERE agency_id = ${agencyId}
        AND category_code = ${categoryCode}
        AND status IN ('held','confirmed','active')
        AND tstzrange(reserved_start, reserved_end, '[)') &&
            tstzrange(${start.toISOString()}::timestamptz, ${end.toISOString()}::timestamptz, '[)')
    `)
    const rows = (
      (usedResult as unknown as { rows?: Array<{ used: number }> }).rows ??
      (Array.isArray(usedResult)
        ? (usedResult as unknown as Array<{ used: number }>)
        : [])
    ) as Array<{ used: number }>
    const used = Number(rows[0]?.used ?? 0)
    if (used >= pool.capacity) {
      throw conflict(
        "INVENTORY_CONFLICT",
        "Pool capacity exhausted for overlapping dates",
        { poolId: pool.id, capacity: pool.capacity, used },
      )
    }
    return { poolId: pool.id, capacity: pool.capacity, used }
  }

  if (opts?.tx) return run(opts.tx)
  return withTransaction(getDb(), run)
}
