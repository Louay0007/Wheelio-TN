import { createHash, randomBytes } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"
import {
  agencies,
  agencyInvitations,
  agencyMemberships,
  agencyReviewReplies,
  agencySettings,
  availabilityBlocks,
  bookingIssues,
  bookingStatusHistory,
  bookings,
  invoices,
  payoutBatches,
  reviews,
  user,
} from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import {
  forbidden,
  notFound,
  validationError,
} from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import {
  requireAgencyContext,
  requireAgencyReadContext,
} from "@/server/modules/agencies/application/ops-extended"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function listTeam(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "team")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const db = getDb()
  const members = await db
    .select({
      id: agencyMemberships.id,
      userId: agencyMemberships.userId,
      role: agencyMemberships.role,
      status: agencyMemberships.status,
      email: user.email,
      name: user.name,
      version: agencyMemberships.version,
    })
    .from(agencyMemberships)
    .innerJoin(user, eq(user.id, agencyMemberships.userId))
    .where(eq(agencyMemberships.agencyId, agencyId))

  const invites = await db.query.agencyInvitations.findMany({
    where: and(
      eq(agencyInvitations.agencyId, agencyId),
      eq(agencyInvitations.status, "pending"),
    ),
  })

  return {
    members,
    invitations: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      status: i.status,
      expiresAt: i.expiresAt.toISOString(),
      version: i.version,
    })),
  }
}

export async function inviteTeamMember(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    email: z.string().email(),
    role: z.enum(["owner", "manager", "agent", "fleet", "accountant"]),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid invite", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "team")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  if (parsed.data.role === "owner" && principal.agencyMemberships[0]?.role !== "owner") {
    throw forbidden("FORBIDDEN", "Only owners can invite owners")
  }

  const token = randomBytes(24).toString("hex")
  const id = createId("ain")
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(agencyInvitations).values({
      id,
      agencyId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      tokenHash: hashToken(token),
      invitedByUserId: principal.actorUserId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    await recordAudit(
      tx,
      {
        action: "agency.team.invited",
        resourceType: "agency_invitation",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
        after: { email: parsed.data.email, role: parsed.data.role },
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "agency_invitation",
      aggregateId: id,
      eventType: "agency.team.invited",
      payload: { agencyId, email: parsed.data.email, role: parsed.data.role },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
  })

  return { id, email: parsed.data.email, role: parsed.data.role, inviteToken: token }
}

export async function updateTeamMember(
  principal: EffectivePrincipal,
  memberId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    role: z.enum(["owner", "manager", "agent", "fleet", "accountant"]).optional(),
    status: z.enum(["active", "disabled"]).optional(),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid member update", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "team")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const member = await tx.query.agencyMemberships.findFirst({
      where: and(
        eq(agencyMemberships.id, memberId),
        eq(agencyMemberships.agencyId, agencyId),
      ),
    })
    if (!member) throw notFound("Team member not found")
    if (member.version !== parsed.data.expectedVersion) {
      throw validationError("Version conflict", {
        expected: parsed.data.expectedVersion,
        actual: member.version,
      })
    }
    const [updated] = await tx
      .update(agencyMemberships)
      .set({
        role: parsed.data.role ?? member.role,
        status: parsed.data.status ?? member.status,
        version: member.version + 1,
        disabledAt:
          parsed.data.status === "disabled" ? new Date() : member.disabledAt,
      })
      .where(eq(agencyMemberships.id, memberId))
      .returning()
    await recordAudit(
      tx,
      {
        action: "agency.team.updated",
        resourceType: "agency_membership",
        resourceId: memberId,
        tenantType: "agency",
        tenantId: agencyId,
        before: { role: member.role, status: member.status },
        after: { role: updated.role, status: updated.status },
      },
      ctx,
      principal,
    )
    return {
      id: updated.id,
      role: updated.role,
      status: updated.status,
      version: updated.version,
    }
  })
}

export async function getAgencySettings(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "settings")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const db = getDb()
  let settings = await db.query.agencySettings.findFirst({
    where: eq(agencySettings.agencyId, agencyId),
  })
  if (!settings) {
    const id = createId("ast")
    const [created] = await db
      .insert(agencySettings)
      .values({ id, agencyId })
      .returning()
    settings = created
  }
  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.id, agencyId),
  })
  return {
    agencyId,
    bookingMode: settings.bookingMode,
    instantEnabled: settings.instantEnabled,
    publicSlug: settings.publicSlug ?? agency?.slug ?? null,
    publicHeadlineEn: settings.publicHeadlineEn,
    publicHeadlineFr: settings.publicHeadlineFr,
    publicBodyEn: settings.publicBodyEn,
    publicBodyFr: settings.publicBodyFr,
    contractRef: settings.contractRef,
    contractStatus: settings.contractStatus,
    verificationStatus: agency?.verificationStatus ?? "draft",
    version: settings.version,
  }
}

export async function updateAgencySettings(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    bookingMode: z.enum(["request", "instant", "hybrid"]).optional(),
    instantEnabled: z.boolean().optional(),
    publicSlug: z.string().min(2).max(80).nullable().optional(),
    publicHeadlineEn: z.string().max(200).nullable().optional(),
    publicHeadlineFr: z.string().max(200).nullable().optional(),
    publicBodyEn: z.string().max(4000).nullable().optional(),
    publicBodyFr: z.string().max(4000).nullable().optional(),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid settings", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "settings")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    let settings = await tx.query.agencySettings.findFirst({
      where: eq(agencySettings.agencyId, agencyId),
    })
    if (!settings) {
      const [created] = await tx
        .insert(agencySettings)
        .values({ id: createId("ast"), agencyId })
        .returning()
      settings = created
    }
    if (settings.version !== parsed.data.expectedVersion) {
      throw validationError("Version conflict", {
        expected: parsed.data.expectedVersion,
        actual: settings.version,
      })
    }
    const { expectedVersion: _, ...patch } = parsed.data
    const [updated] = await tx
      .update(agencySettings)
      .set({ ...patch, version: settings.version + 1 })
      .where(eq(agencySettings.id, settings.id))
      .returning()
    await recordAudit(
      tx,
      {
        action: "agency.settings.updated",
        resourceType: "agency_settings",
        resourceId: settings.id,
        tenantType: "agency",
        tenantId: agencyId,
        after: patch,
      },
      ctx,
      principal,
    )
    return {
      agencyId,
      bookingMode: updated.bookingMode,
      instantEnabled: updated.instantEnabled,
      publicSlug: updated.publicSlug,
      version: updated.version,
    }
  })
}

export async function listAgencyCalendar(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "calendar")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const db = getDb()
  const [blocks, bookingRows] = await Promise.all([
    db.query.availabilityBlocks.findMany({
      where: and(
        eq(availabilityBlocks.agencyId, agencyId),
        eq(availabilityBlocks.status, "active"),
      ),
      orderBy: [desc(availabilityBlocks.startsAt)],
      limit: 200,
    }),
    db.query.bookings.findMany({
      where: eq(bookings.agencyId, agencyId),
      orderBy: [desc(bookings.pickupAt)],
      limit: 200,
    }),
  ])
  return {
    blocks: blocks.map((b) => ({
      id: b.id,
      kind: b.kind,
      label: b.label,
      vehicleId: b.vehicleId,
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
    })),
    bookings: bookingRows.map((b) => ({
      id: b.id,
      reference: b.reference,
      status: b.status,
      pickupAt: b.pickupAt.toISOString(),
      returnAt: b.returnAt.toISOString(),
      branchId: b.branchId,
    })),
  }
}

export async function listAgencyReviews(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "reviews")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const db = getDb()
  const rows = await db.query.reviews.findMany({
    where: eq(reviews.agencyId, agencyId),
    orderBy: [desc(reviews.createdAt)],
    limit: 100,
  })
  const replies = await db.query.agencyReviewReplies.findMany({
    where: eq(agencyReviewReplies.agencyId, agencyId),
  })
  const replyByReview = new Map(replies.map((r) => [r.reviewId, r]))
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    authorDisplayName: r.authorDisplayName,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    reply: replyByReview.get(r.id)
      ? {
          id: replyByReview.get(r.id)!.id,
          body: replyByReview.get(r.id)!.body,
          createdAt: replyByReview.get(r.id)!.createdAt.toISOString(),
        }
      : null,
  }))
}

export async function replyToReview(
  principal: EffectivePrincipal,
  reviewId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({ body: z.string().min(1).max(2000) })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid reply", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "reviews")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const review = await getDb().query.reviews.findFirst({
    where: and(eq(reviews.id, reviewId), eq(reviews.agencyId, agencyId)),
  })
  if (!review) throw notFound("Review not found")

  const id = createId("arr")
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(agencyReviewReplies).values({
      id,
      reviewId,
      agencyId,
      body: parsed.data.body,
      authorUserId: principal.actorUserId,
    })
    await recordAudit(
      tx,
      {
        action: "agency.review.replied",
        resourceType: "agency_review_reply",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
  })
  return { id, reviewId, body: parsed.data.body }
}

export async function getAgencyReports(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "reports")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const db = getDb()
  const bookingRows = await db.query.bookings.findMany({
    where: eq(bookings.agencyId, agencyId),
  })
  const byStatus: Record<string, number> = {}
  for (const b of bookingRows) {
    byStatus[b.status] = (byStatus[b.status] ?? 0) + 1
  }
  return {
    agencyId,
    bookingsTotal: bookingRows.length,
    byStatus,
    note: "Deposit amounts excluded from commercial quality metrics",
  }
}

export async function listAgencyFinance(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "finance")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const db = getDb()
  const [payouts, invoiceRows] = await Promise.all([
    db.query.payoutBatches.findMany({
      where: eq(payoutBatches.agencyId, agencyId),
      orderBy: [desc(payoutBatches.createdAt)],
      limit: 50,
    }),
    db.query.invoices.findMany({
      where: and(
        eq(invoices.agencyId, agencyId),
        eq(invoices.includesDeposit, false),
      ),
      orderBy: [desc(invoices.createdAt)],
      limit: 50,
    }),
  ])
  return {
    payouts: payouts.map((p) => ({
      id: p.id,
      status: p.status,
      totalMillimes: p.totalMillimes.toString(),
      periodStart: p.periodStart.toISOString(),
      periodEnd: p.periodEnd.toISOString(),
    })),
    invoices: invoiceRows.map((i) => ({
      id: i.id,
      kind: i.kind,
      status: i.status,
      totalMillimes: i.totalMillimes.toString(),
      includesDeposit: i.includesDeposit,
      issuedAt: i.issuedAt?.toISOString() ?? null,
    })),
  }
}

export async function prepareBooking(
  principal: EffectivePrincipal,
  bookingId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    checklistJson: z.record(z.string(), z.unknown()).default({}),
    expectedVersion: z.number().int().positive(),
    note: z.string().max(500).optional(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid prepare payload", {
      issues: parsed.error.issues,
    })
  }
  const { agencyId } = requireAgencyContext(principal, "bookings")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.agencyId, agencyId)),
    })
    if (!booking) throw notFound("Booking not found")
    if (booking.version !== parsed.data.expectedVersion) {
      throw validationError("Version conflict", {
        expected: parsed.data.expectedVersion,
        actual: booking.version,
      })
    }
    const [updated] = await tx
      .update(bookings)
      .set({
        status: booking.status === "confirmed" ? "prepared" : booking.status,
        version: booking.version + 1,
      })
      .where(eq(bookings.id, bookingId))
      .returning()
    await tx.insert(bookingStatusHistory).values({
      id: createId("bsh"),
      bookingId,
      fromStatus: booking.status,
      toStatus: updated.status,
      actorUserId: principal.actorUserId,
      reasonCode: "prepare",
      reason: parsed.data.note ?? null,
      requestId: ctx.requestId,
    })
    await recordAudit(
      tx,
      {
        action: "agency.booking.prepared",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "agency",
        tenantId: agencyId,
        metadata: { checklist: parsed.data.checklistJson },
      },
      ctx,
      principal,
    )
    return {
      bookingId,
      status: updated.status,
      version: updated.version,
    }
  })
}

export async function openBookingIssue(
  principal: EffectivePrincipal,
  bookingId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    kind: z.string().min(2).max(40),
    severity: z.enum(["low", "medium", "high"]).default("medium"),
    summary: z.string().min(3).max(200),
    details: z.string().max(4000).optional(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid issue", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "bookings")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const booking = await getDb().query.bookings.findFirst({
    where: and(eq(bookings.id, bookingId), eq(bookings.agencyId, agencyId)),
  })
  if (!booking) throw notFound("Booking not found")

  const id = createId("bis")
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(bookingIssues).values({
      id,
      bookingId,
      agencyId,
      kind: parsed.data.kind,
      severity: parsed.data.severity,
      summary: parsed.data.summary,
      details: parsed.data.details,
      openedByUserId: principal.actorUserId,
    })
    await recordAudit(
      tx,
      {
        action: "agency.booking.issue_opened",
        resourceType: "booking_issue",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking_issue",
      aggregateId: id,
      eventType: "agency.booking.issue_opened",
      payload: { bookingId, agencyId, kind: parsed.data.kind },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
  })
  return { id, bookingId, status: "open" }
}

export async function listBookingDocumentsAgency(
  principal: EffectivePrincipal,
  bookingId: string,
) {
  const { agencyId } = requireAgencyReadContext(principal, "bookings")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const booking = await getDb().query.bookings.findFirst({
    where: and(eq(bookings.id, bookingId), eq(bookings.agencyId, agencyId)),
  })
  if (!booking) throw notFound("Booking not found")
  return {
    bookingId,
    documents: [
      {
        kind: "voucher",
        href: `/api/v1/bookings/${bookingId}/voucher`,
        status: "available",
      },
      {
        kind: "contract",
        href: `/api/v1/bookings/${bookingId}/documents`,
        status: "available",
      },
    ],
  }
}
