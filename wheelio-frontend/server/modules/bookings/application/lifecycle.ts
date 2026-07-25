import { and, eq } from "drizzle-orm"
import { z } from "zod"
import {
  bookingStatusHistory,
  bookings,
  inventoryAllocations,
  inventoryHolds,
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

const CANCELLABLE = new Set([
  "requested",
  "held",
  "payment_pending",
  "confirmed",
])

export async function createCancellationQuote(
  principal: EffectivePrincipal | null,
  bookingId: string,
) {
  const booking = await loadOwnedBooking(principal, bookingId)
  if (!CANCELLABLE.has(booking.status)) {
    throw conflict(
      "ILLEGAL_STATE_TRANSITION",
      `Cannot cancel booking in status ${booking.status}`,
    )
  }
  const refundEstimateMillimes = "0"
  return {
    cancellationQuoteId: createId("cxq"),
    bookingId,
    status: booking.status,
    refundEstimate: {
      amountMillimes: refundEstimateMillimes,
      currency: "TND" as const,
    },
    // Deposit is never part of refund GMV math here.
    depositNote: "Security deposit memo is handled separately at the desk.",
    expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
  }
}

export async function cancelBooking(
  principal: EffectivePrincipal | null,
  bookingId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal?.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot cancel bookings",
    )
  }
  const schema = z.object({
    cancellationQuoteId: z.string().min(1),
    reason: z.string().max(500).optional(),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid cancellation payload", {
      issues: parsed.error.issues,
    })
  }

  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    })
    if (!booking) throw notFound("Booking not found")
    assertBookingAccess(principal, booking)
    if (booking.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Booking version mismatch", {
        expected: parsed.data.expectedVersion,
        actual: booking.version,
      })
    }
    if (!CANCELLABLE.has(booking.status)) {
      throw conflict(
        "ILLEGAL_STATE_TRANSITION",
        `Cannot cancel booking in status ${booking.status}`,
      )
    }

    await tx
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        version: booking.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))

    await tx.insert(bookingStatusHistory).values({
      id: createId("bhist"),
      bookingId,
      fromStatus: booking.status,
      toStatus: "cancelled",
      actorUserId: principal?.actorUserId ?? null,
      effectiveUserId: principal?.effectiveUserId ?? null,
      reason: parsed.data.reason ?? null,
      reasonCode: "customer_cancel",
      source: "api",
      requestId: ctx.requestId,
    })

    await tx
      .update(inventoryAllocations)
      .set({ status: "released", updatedAt: new Date() })
      .where(
        and(
          eq(inventoryAllocations.bookingId, bookingId),
          eq(inventoryAllocations.status, "confirmed"),
        ),
      )

    if (booking.quoteId) {
      await tx
        .update(inventoryHolds)
        .set({ status: "released" })
        .where(
          and(
            eq(inventoryHolds.quoteId, booking.quoteId),
            eq(inventoryHolds.status, "held"),
          ),
        )
    }

    await recordAudit(
      tx,
      {
        action: "booking.cancelled",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "agency",
        tenantId: booking.agencyId,
        reason: parsed.data.reason,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "booking.cancelled",
      payload: { bookingId, fromStatus: booking.status },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "inventory.released",
      payload: { bookingId },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      bookingId,
      status: "cancelled" as const,
      version: booking.version + 1,
    }
  })
}

export async function updateBookingSchedule(
  principal: EffectivePrincipal | null,
  bookingId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal?.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot update schedule",
    )
  }
  const schema = z.object({
    flightNumber: z.string().max(20).optional(),
    landingAt: z.string().datetime({ offset: true }).optional(),
    contactTimingNote: z.string().max(500).optional(),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid schedule payload", {
      issues: parsed.error.issues,
    })
  }

  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    })
    if (!booking) throw notFound("Booking not found")
    assertBookingAccess(principal, booking)
    if (booking.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Booking version mismatch")
    }
    if (!["requested", "confirmed", "held", "payment_pending"].includes(booking.status)) {
      throw conflict(
        "ILLEGAL_STATE_TRANSITION",
        "Schedule can only be updated before active rental",
      )
    }

    await tx
      .update(bookings)
      .set({
        version: booking.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))

    await recordAudit(
      tx,
      {
        action: "booking.schedule_updated",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "agency",
        tenantId: booking.agencyId,
        after: parsed.data,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "booking.schedule_updated",
      payload: { bookingId, ...parsed.data },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      bookingId,
      version: booking.version + 1,
      schedule: {
        flightNumber: parsed.data.flightNumber ?? null,
        landingAt: parsed.data.landingAt ?? null,
        contactTimingNote: parsed.data.contactTimingNote ?? null,
      },
    }
  })
}

export function listBookingDocuments(bookingId: string) {
  return [
    {
      documentId: `doc_contract_${bookingId}`,
      purpose: "contract",
      version: 1,
      available: true,
    },
    {
      documentId: `doc_voucher_${bookingId}`,
      purpose: "voucher",
      version: 1,
      available: true,
    },
  ]
}

export function getBookingVoucher(bookingId: string) {
  return {
    bookingId,
    voucherId: `vch_${bookingId}`,
    version: 1,
    status: "issued",
    downloadPath: `/api/v1/bookings/${bookingId}/documents/doc_voucher_${bookingId}/download`,
  }
}

async function loadOwnedBooking(
  principal: EffectivePrincipal | null,
  bookingId: string,
) {
  const booking = await getDb().query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
  })
  if (!booking) throw notFound("Booking not found")
  assertBookingAccess(principal, booking)
  return booking
}

function assertBookingAccess(
  principal: EffectivePrincipal | null,
  booking: typeof bookings.$inferSelect,
) {
  if (!principal) {
    throw forbidden("BOOKING_ACCESS_REQUIRED", "Booking access is required")
  }
  if (principal.actorClass === "admin") return
  if (principal.actorClass === "agency") {
    const allowed = principal.agencyMemberships.some(
      (m) => m.agencyId === booking.agencyId,
    )
    if (!allowed) {
      throw forbidden("TENANT_SCOPE_VIOLATION", "Booking outside agency scope")
    }
    return
  }
  if (
    !principal.customerProfileId ||
    !booking.customerProfileId ||
    booking.customerProfileId !== principal.customerProfileId
  ) {
    throw forbidden("TENANT_SCOPE_VIOLATION", "Booking belongs to another customer")
  }
}
