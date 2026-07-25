import { desc, eq } from "drizzle-orm"
import { z } from "zod"
import {
  bookings,
  customerProfiles,
  payoutBatches,
  payoutItems,
  refundRequests,
  supportCaseNotes,
  supportCases,
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
import { getBooking } from "@/server/modules/bookings/application/create-booking"

function requireAdmin(principal: EffectivePrincipal, opts?: { write?: boolean }) {
  if (principal.actorClass !== "admin" || !principal.adminMembership) {
    throw forbidden("FORBIDDEN", "Admin role required")
  }
  if (opts?.write && principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot use admin writes",
    )
  }
}

export async function listAdminBookings(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.bookings.findMany({
    with: { snapshot: true },
    orderBy: [desc(bookings.createdAt)],
    limit: 200,
  })
  return rows.map((row) => {
    const payload = (row.snapshot?.payloadJson ?? {}) as {
      contact?: { email?: string; name?: string; phone?: string }
    }
    return {
      bookingId: row.id,
      id: row.id,
      reference: row.reference,
      status: row.status,
      agencyId: row.agencyId,
      confirmation: row.confirmationMode === "instant" ? "instant" : "request",
      paymentMode: row.paymentMode,
      pickupAt: row.pickupAt.toISOString(),
      returnAt: row.returnAt.toISOString(),
      slaExpiresAt: row.slaExpiresAt?.toISOString() ?? null,
      customerName: payload.contact?.name ?? "Guest",
      customerEmail: payload.contact?.email ?? row.guestEmail ?? "",
      listedTotalMillimes: (
        row.snapshot?.commissionableMillimes ?? BigInt(0)
      ).toString(),
      agencyNetMillimes: (
        row.snapshot?.agencyNetMillimes ?? BigInt(0)
      ).toString(),
      commissionMillimes: (
        row.snapshot?.commissionMillimes ?? BigInt(0)
      ).toString(),
      depositMillimes: (row.snapshot?.depositMillimes ?? BigInt(0)).toString(),
      version: row.version,
    }
  })
}

export async function getAdminBookingDetail(
  principal: EffectivePrincipal,
  bookingId: string,
) {
  requireAdmin(principal)
  const booking = await getBooking(principal, bookingId)
  const cases = await getDb().query.supportCases.findMany({
    where: eq(supportCases.bookingId, bookingId),
  })
  return {
    ...booking,
    linkedCases: cases.map((c) => ({
      id: c.id,
      subject: c.subject,
      status: c.status,
      priority: c.priority,
      updatedAt: c.updatedAt.toISOString(),
    })),
  }
}

export async function listAdminCustomers(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.customerProfiles.findMany({
    orderBy: [desc(customerProfiles.updatedAt)],
    limit: 100,
  })
  return rows.map((row) => ({
    userId: row.userId,
    customerProfileId: row.id,
    legalName: row.legalName,
    preferredName: row.preferredName,
    phone: row.phone,
    preferredLocale: row.preferredLocale,
    city: row.city,
    welcomeCompleted: row.welcomeCompleted,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getAdminCustomerDetail(
  principal: EffectivePrincipal,
  userId: string,
) {
  requireAdmin(principal)
  const profile = await getDb().query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, userId),
  })
  if (!profile) throw notFound("Customer not found")
  const trips = await getDb().query.bookings.findMany({
    where: eq(bookings.customerProfileId, profile.id),
    with: { snapshot: true },
    orderBy: [desc(bookings.createdAt)],
    limit: 50,
  })
  return {
    userId: profile.userId,
    customerProfileId: profile.id,
    legalName: profile.legalName,
    preferredName: profile.preferredName,
    phone: profile.phone,
    preferredLocale: profile.preferredLocale,
    city: profile.city,
    addressLine: profile.addressLine,
    welcomeCompleted: profile.welcomeCompleted,
    bookings: trips.map((b) => ({
      bookingId: b.id,
      reference: b.reference,
      status: b.status,
      pickupAt: b.pickupAt.toISOString(),
      listedTotalMillimes: (
        b.snapshot?.commissionableMillimes ?? BigInt(0)
      ).toString(),
      depositMillimes: (b.snapshot?.depositMillimes ?? BigInt(0)).toString(),
    })),
  }
}

export async function listSupportCases(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.supportCases.findMany({
    orderBy: [desc(supportCases.updatedAt)],
    limit: 100,
  })
  return rows.map((c) => ({
    id: c.id,
    subject: c.subject,
    status: c.status,
    priority: c.priority,
    bookingId: c.bookingId,
    agencyId: c.agencyId,
    channel: c.channel,
    tags: c.tagsJson,
    updatedAt: c.updatedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }))
}

export async function getSupportCase(
  principal: EffectivePrincipal,
  caseId: string,
) {
  requireAdmin(principal)
  const row = await getDb().query.supportCases.findFirst({
    where: eq(supportCases.id, caseId),
  })
  if (!row) throw notFound("Case not found")
  const notes = await getDb().query.supportCaseNotes.findMany({
    where: eq(supportCaseNotes.caseId, caseId),
    orderBy: [desc(supportCaseNotes.createdAt)],
    limit: 50,
  })
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    bookingId: row.bookingId,
    agencyId: row.agencyId,
    customerProfileId: row.customerProfileId,
    channel: row.channel,
    tags: row.tagsJson,
    body: row.body,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    notes: notes.map((n) => ({
      id: n.id,
      body: n.body,
      authorUserId: n.authorUserId,
      fromStatus: n.fromStatus,
      toStatus: n.toStatus,
      createdAt: n.createdAt.toISOString(),
    })),
  }
}

export async function updateSupportCase(
  principal: EffectivePrincipal,
  caseId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, { write: true })
  const schema = z.object({
    expectedVersion: z.number().int().positive(),
    status: z.enum(["open", "waiting", "resolved", "escalated"]).optional(),
    priority: z.enum(["low", "normal", "high"]).optional(),
    note: z.string().min(1).max(4000).optional(),
    outcomeTag: z.string().max(80).optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid case update", {
      issues: parsed.error.issues,
    })
  }
  if (
    !parsed.data.status &&
    !parsed.data.priority &&
    !parsed.data.note &&
    !parsed.data.outcomeTag
  ) {
    throw validationError("No case changes provided")
  }

  return withTransaction(getDb(), async (tx) => {
    const row = await tx.query.supportCases.findFirst({
      where: eq(supportCases.id, caseId),
    })
    if (!row) throw notFound("Case not found")
    if (row.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Case version mismatch")
    }

    const nextStatus = parsed.data.status ?? row.status
    const nextPriority = parsed.data.priority ?? row.priority
    const tags = [...row.tagsJson]
    if (parsed.data.outcomeTag && !tags.includes(parsed.data.outcomeTag)) {
      tags.push(parsed.data.outcomeTag)
    }

    await tx
      .update(supportCases)
      .set({
        status: nextStatus,
        priority: nextPriority,
        tagsJson: tags,
        version: row.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(supportCases.id, caseId))

    if (parsed.data.note || parsed.data.status) {
      await tx.insert(supportCaseNotes).values({
        id: createId("cnote"),
        caseId,
        authorUserId: principal.actorUserId,
        body: parsed.data.note ?? `Status → ${nextStatus}`,
        fromStatus: row.status,
        toStatus: nextStatus !== row.status ? nextStatus : null,
      })
    }

    await recordAudit(
      tx,
      {
        action: "support_case.updated",
        resourceType: "support_case",
        resourceId: caseId,
        tenantType: "platform",
        tenantId: "platform",
        after: { status: nextStatus, priority: nextPriority },
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "support_case",
      aggregateId: caseId,
      eventType: "support_case.updated",
      payload: { caseId, status: nextStatus },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      id: caseId,
      status: nextStatus,
      priority: nextPriority,
      version: row.version + 1,
    }
  })
}

export async function createSupportCase(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, { write: true })
  const schema = z.object({
    subject: z.string().min(3).max(200),
    body: z.string().max(5000).optional(),
    priority: z.enum(["low", "normal", "high"]).default("normal"),
    bookingId: z.string().optional(),
    agencyId: z.string().optional(),
    channel: z.enum(["email", "in_app", "phone"]).default("in_app"),
    tags: z.array(z.string()).default([]),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid case", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    const id = createId("case")
    await tx.insert(supportCases).values({
      id,
      subject: parsed.data.subject,
      body: parsed.data.body,
      priority: parsed.data.priority,
      bookingId: parsed.data.bookingId,
      agencyId: parsed.data.agencyId,
      channel: parsed.data.channel,
      tagsJson: parsed.data.tags,
      ownerUserId: principal.actorUserId,
      status: "open",
    })
    await recordAudit(
      tx,
      {
        action: "support_case.created",
        resourceType: "support_case",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { id, status: "open" as const }
  })
}

export async function listPayoutBatches(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.payoutBatches.findMany({
    orderBy: [desc(payoutBatches.createdAt)],
    limit: 100,
  })
  return rows.map((p) => ({
    id: p.id,
    agencyId: p.agencyId,
    status: p.status,
    totalMillimes: p.totalMillimes.toString(),
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
    includesDeposit: false as const,
    version: p.version,
  }))
}

export async function getPayoutBatch(
  principal: EffectivePrincipal,
  payoutId: string,
) {
  requireAdmin(principal)
  const batch = await getDb().query.payoutBatches.findFirst({
    where: eq(payoutBatches.id, payoutId),
  })
  if (!batch) throw notFound("Payout not found")
  const items = await getDb().query.payoutItems.findMany({
    where: eq(payoutItems.payoutId, payoutId),
  })
  return {
    id: batch.id,
    agencyId: batch.agencyId,
    status: batch.status,
    totalMillimes: batch.totalMillimes.toString(),
    periodStart: batch.periodStart.toISOString(),
    periodEnd: batch.periodEnd.toISOString(),
    includesDeposit: false as const,
    items: items.map((i) => ({
      id: i.id,
      bookingId: i.bookingId,
      sourceType: i.sourceType,
      amountMillimes: i.amountMillimes.toString(),
      includesDeposit: i.includesDeposit,
    })),
  }
}

export async function listRefunds(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.refundRequests.findMany({
    orderBy: [desc(refundRequests.createdAt)],
    limit: 100,
  })
  // Filter: never surface deposit-inclusive refunds (invariant).
  return rows
    .filter((r) => !r.includesDeposit)
    .map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      status: r.status,
      reason: r.reason,
      customerAmountMillimes: r.customerAmountMillimes.toString(),
      agencyClawbackMillimes: r.agencyClawbackMillimes.toString(),
      wheelioAbsorbsMillimes: r.wheelioAbsorbsMillimes.toString(),
      includesDeposit: false as const,
      createdAt: r.createdAt.toISOString(),
    }))
}

export async function createRefundRequest(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, { write: true })
  const schema = z.object({
    bookingId: z.string().min(1),
    reason: z.string().min(3).max(500),
    customerAmountMillimes: z.string().regex(/^\d+$/),
    agencyClawbackMillimes: z.string().regex(/^\d+$/).default("0"),
    wheelioAbsorbsMillimes: z.string().regex(/^\d+$/).default("0"),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid refund", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, parsed.data.bookingId),
      with: { snapshot: true },
    })
    if (!booking) throw notFound("Booking not found")
    const id = createId("ref")
    await tx.insert(refundRequests).values({
      id,
      bookingId: parsed.data.bookingId,
      reason: parsed.data.reason,
      customerAmountMillimes: BigInt(parsed.data.customerAmountMillimes),
      agencyClawbackMillimes: BigInt(parsed.data.agencyClawbackMillimes),
      wheelioAbsorbsMillimes: BigInt(parsed.data.wheelioAbsorbsMillimes),
      includesDeposit: false,
      status: "pending",
    })
    await recordAudit(
      tx,
      {
        action: "refund.created",
        resourceType: "refund_request",
        resourceId: id,
        tenantType: "agency",
        tenantId: booking.agencyId,
        after: {
          customerAmountMillimes: parsed.data.customerAmountMillimes,
          includesDeposit: false,
        },
      },
      ctx,
      principal,
    )
    return { id, status: "pending" as const, includesDeposit: false as const }
  })
}