import { createHash } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"
import {
  agencies,
  agencyDocuments,
  agencyInvitations,
  agencyMemberships,
  bookingSnapshots,
  bookings,
  branchDeliveryZones,
  branchHours,
  branches,
  depositMemos,
  invoices,
  payoutBatches,
  payoutItems,
  ratePlans,
  vehicleCategories,
  vehicleCategoryTranslations,
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
import {
  requireAgencyContext,
  requireAgencyReadContext,
} from "@/server/modules/agencies/application/ops-extended"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function getBranch(
  principal: EffectivePrincipal,
  branchId: string,
) {
  const { agencyId } = requireAgencyReadContext(principal, "branches")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const branch = await getDb().query.branches.findFirst({
    where: and(eq(branches.id, branchId), eq(branches.agencyId, agencyId)),
  })
  if (!branch) throw notFound("Branch not found")
  return {
    id: branch.id,
    name: branch.name,
    city: branch.city,
    addressLine: branch.addressLine,
    contactEmail: branch.contactEmail,
    contactPhone: branch.contactPhone,
    active: branch.active,
    publicVisible: branch.publicVisible,
    timezone: branch.timezone,
    version: branch.version,
  }
}

export async function updateBranch(
  principal: EffectivePrincipal,
  branchId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    name: z.string().min(1).max(120).optional(),
    city: z.string().min(1).max(80).optional(),
    addressLine: z.string().max(200).nullable().optional(),
    contactEmail: z.string().email().nullable().optional(),
    contactPhone: z.string().max(40).nullable().optional(),
    active: z.boolean().optional(),
    publicVisible: z.boolean().optional(),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid branch", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "branches")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  return withTransaction(getDb(), async (tx) => {
    const branch = await tx.query.branches.findFirst({
      where: and(eq(branches.id, branchId), eq(branches.agencyId, agencyId)),
    })
    if (!branch) throw notFound("Branch not found")
    if (branch.version !== parsed.data.expectedVersion) {
      throw validationError("Version conflict")
    }
    const { expectedVersion: _, ...patch } = parsed.data
    const [updated] = await tx
      .update(branches)
      .set({ ...patch, version: branch.version + 1 })
      .where(eq(branches.id, branchId))
      .returning()
    await recordAudit(
      tx,
      {
        action: "agency.branch.updated",
        resourceType: "branch",
        resourceId: branchId,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return {
      id: updated.id,
      name: updated.name,
      version: updated.version,
    }
  })
}

export async function getBranchHours(
  principal: EffectivePrincipal,
  branchId: string,
) {
  const { agencyId } = requireAgencyReadContext(principal, "branches")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const branch = await getDb().query.branches.findFirst({
    where: and(eq(branches.id, branchId), eq(branches.agencyId, agencyId)),
  })
  if (!branch) throw notFound("Branch not found")
  let rows = await getDb().query.branchHours.findMany({
    where: eq(branchHours.branchId, branchId),
  })
  if (rows.length === 0) {
    const defaults = Array.from({ length: 7 }, (_, weekday) => ({
      id: createId("bhr"),
      branchId,
      agencyId,
      weekday,
      openTime: weekday === 0 ? "00:00" : "08:00",
      closeTime: weekday === 0 ? "00:00" : "18:00",
      closed: weekday === 0,
    }))
    await getDb().insert(branchHours).values(defaults)
    rows = await getDb().query.branchHours.findMany({
      where: eq(branchHours.branchId, branchId),
    })
  }
  return rows
    .sort((a, b) => a.weekday - b.weekday)
    .map((r) => ({
      weekday: r.weekday,
      openTime: r.openTime,
      closeTime: r.closeTime,
      closed: r.closed,
      version: r.version,
    }))
}

export async function putBranchHours(
  principal: EffectivePrincipal,
  branchId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    hours: z
      .array(
        z.object({
          weekday: z.number().int().min(0).max(6),
          openTime: z.string(),
          closeTime: z.string(),
          closed: z.boolean(),
        }),
      )
      .length(7),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid hours", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "branches")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const branch = await getDb().query.branches.findFirst({
    where: and(eq(branches.id, branchId), eq(branches.agencyId, agencyId)),
  })
  if (!branch) throw notFound("Branch not found")

  await withTransaction(getDb(), async (tx) => {
    for (const h of parsed.data.hours) {
      const existing = await tx.query.branchHours.findFirst({
        where: and(
          eq(branchHours.branchId, branchId),
          eq(branchHours.weekday, h.weekday),
        ),
      })
      if (existing) {
        await tx
          .update(branchHours)
          .set({
            openTime: h.openTime,
            closeTime: h.closeTime,
            closed: h.closed,
            version: existing.version + 1,
          })
          .where(eq(branchHours.id, existing.id))
      } else {
        await tx.insert(branchHours).values({
          id: createId("bhr"),
          branchId,
          agencyId,
          ...h,
        })
      }
    }
    await recordAudit(
      tx,
      {
        action: "agency.branch.hours_updated",
        resourceType: "branch",
        resourceId: branchId,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
  })
  return getBranchHours(principal, branchId)
}

export async function listBranchDelivery(
  principal: EffectivePrincipal,
  branchId: string,
) {
  const { agencyId } = requireAgencyReadContext(principal, "branches")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const branch = await getDb().query.branches.findFirst({
    where: and(eq(branches.id, branchId), eq(branches.agencyId, agencyId)),
  })
  if (!branch) throw notFound("Branch not found")
  const rows = await getDb().query.branchDeliveryZones.findMany({
    where: eq(branchDeliveryZones.branchId, branchId),
  })
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    feeMillimes: r.feeMillimes,
    radiusKm: r.radiusKm,
    active: r.active,
    version: r.version,
  }))
}

export async function upsertBranchDelivery(
  principal: EffectivePrincipal,
  branchId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(80),
    feeMillimes: z.number().int().min(0),
    radiusKm: z.number().int().min(1).max(500),
    active: z.boolean().default(true),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid delivery zone", {
      issues: parsed.error.issues,
    })
  }
  const { agencyId } = requireAgencyContext(principal, "branches")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const branch = await getDb().query.branches.findFirst({
    where: and(eq(branches.id, branchId), eq(branches.agencyId, agencyId)),
  })
  if (!branch) throw notFound("Branch not found")

  return withTransaction(getDb(), async (tx) => {
    if (parsed.data.id) {
      const [updated] = await tx
        .update(branchDeliveryZones)
        .set({
          name: parsed.data.name,
          feeMillimes: parsed.data.feeMillimes,
          radiusKm: parsed.data.radiusKm,
          active: parsed.data.active,
        })
        .where(
          and(
            eq(branchDeliveryZones.id, parsed.data.id),
            eq(branchDeliveryZones.agencyId, agencyId),
          ),
        )
        .returning()
      if (!updated) throw notFound("Delivery zone not found")
      return { id: updated.id, name: updated.name }
    }
    const id = createId("bdz")
    await tx.insert(branchDeliveryZones).values({
      id,
      branchId,
      agencyId,
      name: parsed.data.name,
      feeMillimes: parsed.data.feeMillimes,
      radiusKm: parsed.data.radiusKm,
      active: parsed.data.active,
    })
    await recordAudit(
      tx,
      {
        action: "agency.branch.delivery_upserted",
        resourceType: "branch_delivery_zone",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return { id, name: parsed.data.name }
  })
}

export async function getBookingFinanceAgency(
  principal: EffectivePrincipal,
  bookingId: string,
) {
  const { agencyId } = requireAgencyReadContext(principal, "finance")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const booking = await getDb().query.bookings.findFirst({
    where: and(eq(bookings.id, bookingId), eq(bookings.agencyId, agencyId)),
  })
  if (!booking) throw notFound("Booking not found")
  const [snap, deposit] = await Promise.all([
    getDb().query.bookingSnapshots.findFirst({
      where: eq(bookingSnapshots.bookingId, bookingId),
    }),
    getDb().query.depositMemos.findFirst({
      where: eq(depositMemos.bookingId, bookingId),
    }),
  ])
  return {
    bookingId,
    paymentMode: booking.paymentMode,
    commercial: {
      commissionableMillimes: snap?.commissionableMillimes.toString() ?? "0",
      commissionMillimes: snap?.commissionMillimes.toString() ?? "0",
      agencyNetMillimes: snap?.agencyNetMillimes.toString() ?? "0",
    },
    deposit: deposit
      ? {
          amountMillimes: deposit.amountMillimes.toString(),
          status: deposit.status,
          note: "Deposit excluded from GMV/commission/payouts",
        }
      : null,
  }
}

export async function acceptAgencyInvite(
  principal: EffectivePrincipal,
  token: string,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden("IMPERSONATION_READ_ONLY", "Cannot accept invites while impersonating")
  }
  const tokenHash = hashToken(token)
  const invite = await getDb().query.agencyInvitations.findFirst({
    where: and(
      eq(agencyInvitations.tokenHash, tokenHash),
      eq(agencyInvitations.status, "pending"),
    ),
  })
  if (!invite) throw notFound("Invitation not found or expired")
  if (invite.expiresAt.getTime() < Date.now()) {
    throw validationError("Invitation expired")
  }
  if (invite.email.toLowerCase() !== principal.email.toLowerCase()) {
    throw forbidden("FORBIDDEN", "Invitation email does not match signed-in user")
  }

  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.agencyMemberships.findFirst({
      where: and(
        eq(agencyMemberships.agencyId, invite.agencyId),
        eq(agencyMemberships.userId, principal.actorUserId),
      ),
    })
    let membershipId = existing?.id
    if (!existing) {
      membershipId = createId("agm")
      await tx.insert(agencyMemberships).values({
        id: membershipId,
        agencyId: invite.agencyId,
        userId: principal.actorUserId,
        role: invite.role,
        status: "active",
        acceptedAt: new Date(),
        invitedByUserId: invite.invitedByUserId,
      })
    }
    await tx
      .update(agencyInvitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        acceptedUserId: principal.actorUserId,
      })
      .where(eq(agencyInvitations.id, invite.id))
    await recordAudit(
      tx,
      {
        action: "agency.invite.accepted",
        resourceType: "agency_invitation",
        resourceId: invite.id,
        tenantType: "agency",
        tenantId: invite.agencyId,
      },
      ctx,
      principal,
    )
    return {
      agencyId: invite.agencyId,
      membershipId,
      role: invite.role,
    }
  })
}

export async function listAgencyPayouts(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "finance")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.payoutBatches.findMany({
    where: eq(payoutBatches.agencyId, agencyId),
    orderBy: [desc(payoutBatches.createdAt)],
    limit: 100,
  })
  return rows.map((p) => ({
    id: p.id,
    status: p.status,
    totalMillimes: p.totalMillimes.toString(),
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
  }))
}

export async function getAgencyPayout(
  principal: EffectivePrincipal,
  payoutId: string,
) {
  const { agencyId } = requireAgencyReadContext(principal, "finance")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const payout = await getDb().query.payoutBatches.findFirst({
    where: and(
      eq(payoutBatches.id, payoutId),
      eq(payoutBatches.agencyId, agencyId),
    ),
  })
  if (!payout) throw notFound("Payout not found")
  const items = await getDb().query.payoutItems.findMany({
    where: eq(payoutItems.payoutId, payoutId),
  })
  return {
    id: payout.id,
    status: payout.status,
    totalMillimes: payout.totalMillimes.toString(),
    periodStart: payout.periodStart.toISOString(),
    periodEnd: payout.periodEnd.toISOString(),
    items: items.map((i) => ({
      id: i.id,
      bookingId: i.bookingId,
      sourceType: i.sourceType,
      amountMillimes: i.amountMillimes.toString(),
      includesDeposit: i.includesDeposit,
    })),
  }
}

export async function listAgencyInvoices(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "finance")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.invoices.findMany({
    where: and(
      eq(invoices.agencyId, agencyId),
      eq(invoices.includesDeposit, false),
    ),
    orderBy: [desc(invoices.createdAt)],
  })
  return rows.map((i) => ({
    id: i.id,
    kind: i.kind,
    status: i.status,
    totalMillimes: i.totalMillimes.toString(),
    includesDeposit: i.includesDeposit,
    issuedAt: i.issuedAt?.toISOString() ?? null,
  }))
}

export async function getAgencyLedger(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "finance")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const agency = await getDb().query.agencies.findFirst({
    where: eq(agencies.id, agencyId),
  })
  const finance = await listAgencyPayouts(principal)
  const invoiceRows = await listAgencyInvoices(principal)
  return {
    agencyId,
    tradeName: agency?.tradeName,
    payouts: finance,
    invoices: invoiceRows,
    note: "Deposit lines are never included in ledger commercial views",
  }
}

export async function listFleetCategories(principal: EffectivePrincipal) {
  requireAgencyReadContext(principal, "fleet")
  const cats = await getDb().query.vehicleCategories.findMany({
    where: eq(vehicleCategories.active, true),
  })
  const tr = await getDb().query.vehicleCategoryTranslations.findMany()
  return cats.map((c) => ({
    id: c.id,
    code: c.code,
    names: tr
      .filter((t) => t.categoryId === c.id)
      .map((t) => ({ locale: t.locale, name: t.label })),
  }))
}

export async function previewRatePlan(
  principal: EffectivePrincipal,
  raw: unknown,
) {
  const schema = z.object({
    planId: z.string().optional(),
    dailyMillimes: z.string().regex(/^\d+$/).optional(),
    days: z.number().int().min(1).max(90).default(3),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid preview", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyReadContext(principal, "rates")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  let daily = parsed.data.dailyMillimes
    ? BigInt(parsed.data.dailyMillimes)
    : 100_000n
  if (parsed.data.planId) {
    const plan = await getDb().query.ratePlans.findFirst({
      where: and(
        eq(ratePlans.id, parsed.data.planId),
        eq(ratePlans.agencyId, agencyId),
      ),
    })
    if (!plan) throw notFound("Rate plan not found")
    daily = plan.netDailyMillimes
  }
  const rental = daily * BigInt(parsed.data.days)
  return {
    days: parsed.data.days,
    dailyMillimes: daily.toString(),
    rentalMillimes: rental.toString(),
    depositMillimes: "0",
    note: "Preview excludes deposit; deposit is separate at checkout",
  }
}

export async function getQualityReport(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "reports")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const bookingRows = await getDb().query.bookings.findMany({
    where: eq(bookings.agencyId, agencyId),
  })
  const completed = bookingRows.filter((b) => b.status === "completed").length
  const cancelled = bookingRows.filter((b) =>
    b.status.startsWith("cancel"),
  ).length
  return {
    agencyId,
    completed,
    cancelled,
    acceptanceRateBps:
      bookingRows.length === 0
        ? 0
        : Math.round(
            ((bookingRows.length - cancelled) / bookingRows.length) * 10_000,
          ),
    note: "Quality metrics exclude deposit amounts",
  }
}

export async function listAgencyDocuments(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "onboarding")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.agencyDocuments.findMany({
    where: eq(agencyDocuments.agencyId, agencyId),
  })
  return rows.map((d) => ({
    id: d.id,
    kind: d.kind,
    title: d.title,
    status: d.status,
    storedObjectId: d.storedObjectId,
    version: d.version,
  }))
}

export async function upsertAgencyDocument(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    id: z.string().optional(),
    kind: z.string().min(2).max(40),
    title: z.string().min(2).max(120),
    storedObjectId: z.string().optional(),
    status: z.enum(["pending", "submitted", "approved", "rejected"]).optional(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid document", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "onboarding")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  return withTransaction(getDb(), async (tx) => {
    if (parsed.data.id) {
      const [updated] = await tx
        .update(agencyDocuments)
        .set({
          title: parsed.data.title,
          storedObjectId: parsed.data.storedObjectId,
          status: parsed.data.status ?? "submitted",
        })
        .where(
          and(
            eq(agencyDocuments.id, parsed.data.id),
            eq(agencyDocuments.agencyId, agencyId),
          ),
        )
        .returning()
      if (!updated) throw notFound("Document not found")
      return { id: updated.id, status: updated.status }
    }
    const id = createId("adoc")
    await tx.insert(agencyDocuments).values({
      id,
      agencyId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      storedObjectId: parsed.data.storedObjectId,
      status: parsed.data.status ?? "pending",
    })
    await recordAudit(
      tx,
      {
        action: "agency.document.upserted",
        resourceType: "agency_document",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return { id, status: "pending" }
  })
}
