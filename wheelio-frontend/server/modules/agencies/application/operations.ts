import { and, eq } from "drizzle-orm"
import { z } from "zod"
import {
  bookingStatusHistory,
  bookings,
  inventoryAllocations,
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

function requireAgencyMember(principal: EffectivePrincipal, agencyId: string) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot mutate agency bookings",
    )
  }
  const membership = principal.agencyMemberships.find(
    (m) => m.agencyId === agencyId && m.status === "active",
  )
  if (!membership && principal.actorClass !== "admin") {
    throw forbidden("TENANT_SCOPE_VIOLATION", "Not a member of this agency")
  }
  const role = membership?.role ?? principal.adminMembership?.role
  if (
    role &&
    !["owner", "manager", "agent", "super", "support"].includes(role) &&
    principal.actorClass !== "admin"
  ) {
    throw forbidden("FORBIDDEN", "Role cannot accept bookings")
  }
  return membership
}

export async function getAgencyDashboard(principal: EffectivePrincipal) {
  if (principal.agencyMemberships.length === 0 && principal.actorClass !== "admin") {
    throw forbidden("FORBIDDEN", "Agency membership required")
  }
  const agencyId =
    principal.tenantType === "agency"
      ? principal.tenantId
      : principal.agencyMemberships[0]?.agencyId
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  const db = getDb()
  const rows = await db.query.bookings.findMany({
    where: eq(bookings.agencyId, agencyId),
  })
  const requested = rows.filter((r) => r.status === "requested").length
  const confirmed = rows.filter((r) => r.status === "confirmed").length
  const active = rows.filter((r) => r.status === "active").length
  return {
    agencyId,
    queues: {
      requested,
      confirmed,
      active,
    },
    // Finance summary excludes deposits by construction.
    finance: {
      openBookings: requested + confirmed + active,
      note: "Deposit memos are excluded from GMV summaries",
    },
  }
}

export async function listAgencyBookings(principal: EffectivePrincipal) {
  const agencyId =
    principal.tenantType === "agency"
      ? principal.tenantId
      : principal.agencyMemberships[0]?.agencyId
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  requireAgencyMember(principal, agencyId)
  const rows = await getDb().query.bookings.findMany({
    where: eq(bookings.agencyId, agencyId),
    with: { snapshot: true },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  })
  return rows.map((row) => {
    const payload = (row.snapshot?.payloadJson ?? {}) as {
      contact?: { email?: string; name?: string; phone?: string }
      driver?: { fullName?: string }
    }
    const commissionable = row.snapshot?.commissionableMillimes ?? BigInt(0)
    const commission = row.snapshot?.commissionMillimes ?? BigInt(0)
    const agencyNet = row.snapshot?.agencyNetMillimes ?? BigInt(0)
    const deposit = row.snapshot?.depositMillimes ?? BigInt(0)
    return {
      bookingId: row.id,
      id: row.id,
      reference: row.reference,
      status: row.status,
      confirmation: row.confirmationMode === "instant" ? "instant" : "request",
      paymentMode: row.paymentMode,
      pickupAt: row.pickupAt.toISOString(),
      returnAt: row.returnAt.toISOString(),
      slaExpiresAt: row.slaExpiresAt?.toISOString() ?? null,
      branchId: row.branchId,
      version: row.version,
      customerName: payload.contact?.name ?? "Guest",
      customerEmail: payload.contact?.email ?? row.guestEmail ?? "",
      customerPhone: payload.contact?.phone ?? "",
      driverName: payload.driver?.fullName ?? payload.contact?.name ?? "Guest",
      // Millimes as strings for API; UI converts. Deposit never folded into listed.
      listedTotalMillimes: commissionable.toString(),
      agencyNetMillimes: agencyNet.toString(),
      commissionMillimes: commission.toString(),
      depositMillimes: deposit.toString(),
    }
  })
}

export async function acceptAgencyBooking(
  principal: EffectivePrincipal,
  bookingId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    vehicleId: z.string().min(1).optional(),
    note: z.string().max(500).optional(),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid acceptance payload", {
      issues: parsed.error.issues,
    })
  }

  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    })
    if (!booking) throw notFound("Booking not found")
    requireAgencyMember(principal, booking.agencyId)
    if (booking.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Booking version mismatch")
    }
    if (booking.status !== "requested") {
      throw conflict(
        "ILLEGAL_STATE_TRANSITION",
        `Cannot accept booking in status ${booking.status}`,
      )
    }
    if (booking.slaExpiresAt && booking.slaExpiresAt < new Date()) {
      throw conflict("HOLD_EXPIRED", "Acceptance SLA has expired")
    }

    const nextStatus =
      booking.paymentMode === "deposit_online" ? "payment_pending" : "confirmed"

    await tx
      .update(bookings)
      .set({
        status: nextStatus,
        acceptedAt: new Date(),
        version: booking.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))

    if (parsed.data.vehicleId) {
      try {
        await tx.insert(inventoryAllocations).values({
          id: createId("alloc"),
          bookingId,
          agencyId: booking.agencyId,
          vehicleId: parsed.data.vehicleId,
          reservedStart: booking.pickupAt,
          reservedEnd: booking.returnAt,
          status: "confirmed",
          allocatedByUserId: principal.actorUserId,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (message.includes("no_overlapping_vehicle") || message.includes("23P01")) {
          throw conflict(
            "INVENTORY_CONFLICT",
            "Vehicle allocation conflict on acceptance",
          )
        }
        throw error
      }
    }

    await tx.insert(bookingStatusHistory).values({
      id: createId("bhist"),
      bookingId,
      fromStatus: booking.status,
      toStatus: nextStatus,
      actorUserId: principal.actorUserId,
      effectiveUserId: principal.effectiveUserId,
      reason: parsed.data.note ?? null,
      reasonCode: "agency_accept",
      source: "api",
      requestId: ctx.requestId,
    })

    await recordAudit(
      tx,
      {
        action: "booking.accepted",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "agency",
        tenantId: booking.agencyId,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "booking.accepted",
      payload: { bookingId, status: nextStatus },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      bookingId,
      status: nextStatus,
      version: booking.version + 1,
    }
  })
}

export async function declineAgencyBooking(
  principal: EffectivePrincipal,
  bookingId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot decline bookings",
    )
  }
  const schema = z.object({
    reasonCode: z
      .enum(["unavailable", "documents", "out_of_area", "other"])
      .default("unavailable"),
    note: z.string().max(500).optional(),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid decline payload", {
      issues: parsed.error.issues,
    })
  }

  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    })
    if (!booking) throw notFound("Booking not found")
    requireAgencyMember(principal, booking.agencyId)
    if (booking.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Booking version mismatch")
    }
    if (!["requested", "held"].includes(booking.status)) {
      throw conflict(
        "ILLEGAL_STATE_TRANSITION",
        `Cannot decline booking in status ${booking.status}`,
      )
    }

    await tx
      .update(bookings)
      .set({
        status: "rejected",
        cancelledAt: new Date(),
        version: booking.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))

    await tx.insert(bookingStatusHistory).values({
      id: createId("bhist"),
      bookingId,
      fromStatus: booking.status,
      toStatus: "rejected",
      actorUserId: principal.actorUserId,
      effectiveUserId: principal.effectiveUserId,
      reason: parsed.data.note ?? null,
      reasonCode: `agency_decline_${parsed.data.reasonCode}`,
      source: "api",
      requestId: ctx.requestId,
    })

    await recordAudit(
      tx,
      {
        action: "booking.declined",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "agency",
        tenantId: booking.agencyId,
        after: { reasonCode: parsed.data.reasonCode },
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "booking.declined",
      payload: {
        bookingId,
        reasonCode: parsed.data.reasonCode,
      },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      bookingId,
      status: "rejected" as const,
      version: booking.version + 1,
    }
  })
}
