import { and, count, eq, gt, sql } from "drizzle-orm"
import { z } from "zod"
import {
  beginIdempotency,
  completeIdempotency,
  hashRequestPayload,
} from "@/server/core/idempotency/service"
import {
  bookingSnapshots,
  bookingStatusHistory,
  bookings,
  customerDrivers,
  depositMemos,
  inventoryAllocations,
  inventoryHolds,
  quotes,
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
  createBookingReference,
  hashSnapshotPayload,
} from "@/server/modules/pricing/domain/quote-money"
import {
  ensureProfile,
  findProfileByUserId,
} from "@/server/modules/customers/infrastructure/customer-repository"

const createBookingSchema = z.object({
  quoteId: z.string().min(1),
  expectedQuoteVersion: z.number().int().positive().default(1),
  contactEmail: z.string().email(),
  contactName: z.string().min(1).max(120),
  driverFullName: z.string().min(1).max(120),
  driverLicenseCountry: z.string().min(2).max(80),
  contactPhone: z.string().min(7).max(40).optional(),
  driverId: z.string().min(1).optional(),
  paymentMode: z.enum(["deposit_online", "pay_at_agency"]).optional(),
  locale: z.enum(["en", "fr"]).default("en"),
})

type CreateBookingResponse = {
  bookingId: string
  reference: string
  status: string
  version: number
  agencyId: string
  paymentMode: string
  deposit: { amountMillimes: string; currency: "TND"; status: string }
  pricing: {
    commissionableMillimes: string
    commissionMillimes: string
    agencyNetMillimes: string
    currency: "TND"
  }
}

export async function createBooking(
  principal: EffectivePrincipal | null,
  rawInput: unknown,
  ctx: RequestContext,
  idempotencyKey?: string | null,
): Promise<CreateBookingResponse> {
  const parsed = createBookingSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid booking payload", {
      issues: parsed.error.issues,
    })
  }
  const input = parsed.data
  const db = getDb()

  return withTransaction(db, async (tx) => {
    const principalKey =
      principal?.effectiveUserId ?? `guest:${input.contactEmail.toLowerCase()}`
    if (!idempotencyKey) {
      throw validationError("Idempotency-Key header is required")
    }
    const gate = await beginIdempotency({
      db: tx,
      principalKey,
      scope: "booking.create",
      key: idempotencyKey,
      requestHash: hashRequestPayload(input),
    })
    if (gate.kind === "replay") {
      return gate.responseBody as CreateBookingResponse
    }
    if (gate.kind === "in_flight") {
      throw conflict(
        "IDEMPOTENCY_KEY_REUSED",
        "Booking command is already in progress",
      )
    }

    const lockedQuote = await tx.execute<{ id: string }>(
      sql`SELECT id FROM quotes WHERE id = ${input.quoteId} FOR UPDATE`,
    )
    const lockedRows =
      (lockedQuote as unknown as { rows?: Array<{ id: string }> }).rows ?? []
    if (!lockedRows.length) throw notFound("Quote not found")
    const quote = await tx.query.quotes.findFirst({
      where: eq(quotes.id, input.quoteId),
      with: { snapshot: true },
    })
    if (!quote || !quote.snapshot) throw notFound("Quote not found")
    if (quote.expiresAt < new Date() || quote.status !== "open") {
      throw conflict("HOLD_EXPIRED", "Quote has expired")
    }
    if (quote.version !== input.expectedQuoteVersion) {
      throw conflict("VERSION_CONFLICT", "Quote version mismatch", {
        expected: input.expectedQuoteVersion,
        actual: quote.version,
      })
    }

    let customerProfileId: string | null = null
    if (principal) {
      if (principal.impersonating) {
        throw forbidden(
          "IMPERSONATION_READ_ONLY",
          "Impersonation cannot create bookings",
        )
      }
      let profile = await findProfileByUserId(tx, principal.effectiveUserId)
      if (!profile) {
        profile = await ensureProfile(tx, {
          userId: principal.effectiveUserId,
          legalName: input.contactName,
        })
      }
      customerProfileId = profile.id
    }

    if (input.driverId) {
      if (!customerProfileId) {
        throw forbidden("FORBIDDEN", "Guest checkout cannot select an account driver")
      }
      const ownedDriver = await tx.query.customerDrivers.findFirst({
        where: and(
          eq(customerDrivers.id, input.driverId),
          eq(customerDrivers.customerProfileId, customerProfileId),
        ),
      })
      if (!ownedDriver) throw forbidden("TENANT_SCOPE_VIOLATION", "Driver ownership mismatch")
    }

    const activeHold = await tx.query.inventoryHolds.findFirst({
      where: and(
        eq(inventoryHolds.quoteId, quote.id),
        eq(inventoryHolds.status, "held"),
        gt(inventoryHolds.expiresAt, new Date()),
      ),
    })
    if (!activeHold?.vehicleId) {
      throw conflict("HOLD_EXPIRED", "The inventory hold expired; refresh the offer")
    }

    const [countRow] = await tx.select({ value: count() }).from(bookings)
    const reference = createBookingReference(
      881000 + Number(countRow?.value ?? 0) + 1,
    )
    const bookingId = createId("bkg")
    const paymentMode = input.paymentMode ?? quote.paymentMode
    const status =
      quote.confirmationMode === "instant" ? "confirmed" : "requested"

    const snapshotPayload = {
      quoteId: quote.id,
      quoteSnapshot: quote.snapshot.payloadJson,
      contact: {
        email: input.contactEmail,
        name: input.contactName,
        phone: input.contactPhone ?? null,
      },
      driver: {
        id: input.driverId ?? null,
        fullName: input.driverFullName,
        licenseCountry: input.driverLicenseCountry,
      },
      paymentMode,
      locale: input.locale,
    }

    await tx.insert(bookings).values({
      id: bookingId,
      reference,
      customerProfileId,
      guestEmail: customerProfileId ? null : input.contactEmail,
      agencyId: quote.agencyId,
      quoteId: quote.id,
      status,
      confirmationMode: quote.confirmationMode,
      paymentMode,
      pickupAt: quote.pickupAt,
      returnAt: quote.returnAt,
      slaExpiresAt:
        status === "requested"
          ? new Date(Date.now() + 1000 * 60 * 60 * 2)
          : null,
    })

    await tx.insert(bookingSnapshots).values({
      id: createId("bsnap"),
      bookingId,
      payloadJson: snapshotPayload,
      payloadHash: hashSnapshotPayload(snapshotPayload),
      locale: input.locale,
      commissionableMillimes: quote.snapshot.commissionableMillimes,
      commissionMillimes: quote.snapshot.commissionMillimes,
      agencyNetMillimes: quote.snapshot.agencyNetMillimes,
      depositMillimes: quote.snapshot.depositMillimes,
    })

    await tx.insert(bookingStatusHistory).values({
      id: createId("bhist"),
      bookingId,
      fromStatus: null,
      toStatus: status,
      actorUserId: principal?.actorUserId ?? null,
      effectiveUserId: principal?.effectiveUserId ?? null,
      source: "api",
      requestId: ctx.requestId,
    })

    await tx.insert(depositMemos).values({
      id: createId("dep"),
      bookingId,
      holder: "agency",
      amountMillimes: quote.snapshot.depositMillimes,
      status: "expected",
      method: paymentMode === "pay_at_agency" ? "desk" : "provider",
    })

    if (activeHold.vehicleId) {
      try {
        await tx.insert(inventoryAllocations).values({
          id: createId("alloc"),
          bookingId,
          agencyId: quote.agencyId,
          vehicleId: activeHold.vehicleId,
          categoryCode: quote.categoryCode,
          reservedStart: quote.pickupAt,
          reservedEnd: quote.returnAt,
          status: status === "confirmed" ? "confirmed" : "held",
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (
          message.includes("no_overlapping_vehicle") ||
          message.includes("23P01")
        ) {
          throw conflict(
            "INVENTORY_CONFLICT",
            "Vehicle allocation conflict during booking",
          )
        }
        throw error
      }
      await tx
        .update(inventoryHolds)
        .set({ status: "converted" })
        .where(eq(inventoryHolds.id, activeHold.id))
    }

    await tx
      .update(quotes)
      .set({ status: "converted", updatedAt: new Date() })
      .where(eq(quotes.id, quote.id))

    const guestPrincipal: EffectivePrincipal = {
      actorUserId: "guest",
      effectiveUserId: "guest",
      email: input.contactEmail,
      emailVerified: false,
      name: input.contactName,
      actorClass: "customer",
      tenantType: "customer",
      tenantId: null,
      roles: ["guest"],
      customerProfileId: null,
      agencyMemberships: [],
      adminMembership: null,
      impersonating: false,
      impersonationGrantId: null,
      sessionId: null,
      sessionCreatedAt: null,
    }

    await recordAudit(
      tx,
      {
        action: "booking.created",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "agency",
        tenantId: quote.agencyId,
        after: { bookingId, reference, status },
      },
      ctx,
      principal ?? guestPrincipal,
    )

    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType:
        status === "confirmed" ? "booking.confirmed" : "booking.requested",
      payload: {
        bookingId,
        reference,
        agencyId: quote.agencyId,
        commissionableMillimes:
          quote.snapshot.commissionableMillimes.toString(),
      },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    const response = {
      bookingId,
      reference,
      status,
      version: 1,
      agencyId: quote.agencyId,
      paymentMode,
      deposit: {
        amountMillimes: quote.snapshot.depositMillimes.toString(),
        currency: "TND" as const,
        status: "expected",
      },
      pricing: {
        commissionableMillimes:
          quote.snapshot.commissionableMillimes.toString(),
        commissionMillimes: quote.snapshot.commissionMillimes.toString(),
        agencyNetMillimes: quote.snapshot.agencyNetMillimes.toString(),
        currency: "TND" as const,
      },
    }
    await completeIdempotency({
      db: tx,
      id: gate.id,
      statusCode: 201,
      responseBody: response,
      resourceId: bookingId,
    })
    return response
  })
}

export async function getBooking(
  principal: EffectivePrincipal | null,
  bookingId: string,
) {
  const db = getDb()
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: {
      snapshot: true,
      depositMemos: true,
      statusHistory: true,
    },
  })
  if (!booking) throw notFound("Booking not found")

  if (principal?.actorClass === "customer" && principal.customerProfileId) {
    if (booking.customerProfileId !== principal.customerProfileId) {
      throw forbidden(
        "TENANT_SCOPE_VIOLATION",
        "Booking belongs to another customer",
      )
    }
  } else if (principal?.actorClass === "agency") {
    const allowed = principal.agencyMemberships.some(
      (m) => m.agencyId === booking.agencyId && m.status === "active",
    )
    if (!allowed) {
      throw forbidden(
        "TENANT_SCOPE_VIOLATION",
        "Booking outside agency membership",
      )
    }
  } else if (principal?.actorClass === "admin") {
    // platform read OK
  } else if (principal) {
    throw forbidden("FORBIDDEN", "Cannot read booking")
  } else {
    throw forbidden("BOOKING_ACCESS_REQUIRED", "Booking access is required")
  }

  const payload = (booking.snapshot?.payloadJson ?? {}) as {
    contact?: { email?: string; name?: string; phone?: string }
    driver?: { fullName?: string }
  }

  return {
    bookingId: booking.id,
    reference: booking.reference,
    status: booking.status,
    version: booking.version,
    agencyId: booking.agencyId,
    agencyName:
      ((booking.snapshot?.payloadJson as {
        quoteSnapshot?: { agencyName?: string }
      } | null)?.quoteSnapshot?.agencyName) ?? null,
    branchId: booking.branchId,
    confirmationMode: booking.confirmationMode,
    paymentMode: booking.paymentMode,
    pickupAt: booking.pickupAt.toISOString(),
    returnAt: booking.returnAt.toISOString(),
    slaExpiresAt: booking.slaExpiresAt?.toISOString() ?? null,
    guestEmail: booking.guestEmail,
    contactName: payload.contact?.name ?? null,
    contactEmail: payload.contact?.email ?? booking.guestEmail,
    contactPhone: payload.contact?.phone ?? null,
    driverName: payload.driver?.fullName ?? null,
    vehicle:
      ((booking.snapshot?.payloadJson as {
        quoteSnapshot?: {
          vehicle?: { make: string; model: string; year: number | null }
        }
      } | null)?.quoteSnapshot?.vehicle) ?? null,
    deposit: booking.depositMemos[0]
      ? {
          amountMillimes: booking.depositMemos[0].amountMillimes.toString(),
          currency: "TND" as const,
          status: booking.depositMemos[0].status,
        }
      : booking.snapshot
        ? {
            amountMillimes: booking.snapshot.depositMillimes.toString(),
            currency: "TND" as const,
            status: "expected",
          }
        : null,
    pricing: booking.snapshot
      ? {
          commissionableMillimes:
            booking.snapshot.commissionableMillimes.toString(),
          commissionMillimes: booking.snapshot.commissionMillimes.toString(),
          agencyNetMillimes: booking.snapshot.agencyNetMillimes.toString(),
          depositMillimes: booking.snapshot.depositMillimes.toString(),
          currency: "TND" as const,
        }
      : null,
    timeline: booking.statusHistory.map((row) => ({
      toStatus: row.toStatus,
      fromStatus: row.fromStatus,
      occurredAt: row.occurredAt.toISOString(),
      reasonCode: row.reasonCode,
    })),
  }
}

export async function listCustomerBookings(principal: EffectivePrincipal) {
  const db = getDb()
  let profileId = principal.customerProfileId
  if (!profileId) {
    const profile = await findProfileByUserId(db, principal.effectiveUserId)
    profileId = profile?.id ?? null
  }
  if (!profileId) return []
  const rows = await db.query.bookings.findMany({
    where: and(eq(bookings.customerProfileId, profileId)),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  })
  return rows.map((row) => ({
    bookingId: row.id,
    reference: row.reference,
    status: row.status,
    pickupAt: row.pickupAt.toISOString(),
    returnAt: row.returnAt.toISOString(),
    agencyId: row.agencyId,
  }))
}
