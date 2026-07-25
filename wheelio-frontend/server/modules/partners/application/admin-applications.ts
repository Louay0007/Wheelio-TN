import { createHash } from "node:crypto"
import { desc, eq } from "drizzle-orm"
import { z } from "zod"
import {
  agencies,
  agencyProfilesI18n,
  partnerApplicationNotes,
  partnerApplications,
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

const OPEN_STATUSES = ["new", "docs_requested", "in_review"] as const

function requirePartnerAdmin(
  principal: EffectivePrincipal,
  opts?: { write?: boolean },
) {
  if (principal.actorClass !== "admin" || !principal.adminMembership) {
    throw forbidden("FORBIDDEN", "Admin role required")
  }
  if (opts?.write && principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot mutate partner applications",
    )
  }
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

export async function listPartnerApplications(principal: EffectivePrincipal) {
  requirePartnerAdmin(principal)
  const rows = await getDb().query.partnerApplications.findMany({
    orderBy: [desc(partnerApplications.submittedAt)],
    limit: 200,
  })
  return rows.map((a) => ({
    id: a.id,
    status: a.status,
    tradeName: a.tradeName,
    legalName: a.legalName,
    city: a.city,
    email: a.email,
    phone: a.phone,
    fleetSizeEstimate: a.fleetSizeEstimate,
    branchesPlanned: a.branchesPlanned,
    preferredLocale: a.preferredLocale,
    resultingAgencyId: a.resultingAgencyId,
    submittedAt: a.submittedAt.toISOString(),
    decidedAt: a.decidedAt?.toISOString() ?? null,
    version: a.version,
  }))
}

export async function getPartnerApplication(
  principal: EffectivePrincipal,
  applicationId: string,
) {
  requirePartnerAdmin(principal)
  const row = await getDb().query.partnerApplications.findFirst({
    where: eq(partnerApplications.id, applicationId),
  })
  if (!row) throw notFound("Application not found")
  const notes = await getDb().query.partnerApplicationNotes.findMany({
    where: eq(partnerApplicationNotes.applicationId, applicationId),
    orderBy: [desc(partnerApplicationNotes.createdAt)],
    limit: 50,
  })
  return {
    id: row.id,
    status: row.status,
    tradeName: row.tradeName,
    legalName: row.legalName,
    city: row.city,
    email: row.email,
    phone: row.phone,
    fleetSizeEstimate: row.fleetSizeEstimate,
    branchesPlanned: row.branchesPlanned,
    preferredLocale: row.preferredLocale,
    source: row.source,
    docs: row.docsJson,
    decisionReason: row.decisionReason,
    decisionReasonCode: row.decisionReasonCode,
    resultingAgencyId: row.resultingAgencyId,
    submittedAt: row.submittedAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
    version: row.version,
    notes: notes.map((n) => ({
      id: n.id,
      body: n.body,
      authorUserId: n.authorUserId,
      createdAt: n.createdAt.toISOString(),
    })),
  }
}

export async function requestApplicationDocuments(
  principal: EffectivePrincipal,
  applicationId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requirePartnerAdmin(principal, { write: true })
  const schema = z.object({
    expectedVersion: z.number().int().positive(),
    message: z.string().max(1000).optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid documents request", {
      issues: parsed.error.issues,
    })
  }
  return withTransaction(getDb(), async (tx) => {
    const row = await tx.query.partnerApplications.findFirst({
      where: eq(partnerApplications.id, applicationId),
    })
    if (!row) throw notFound("Application not found")
    if (row.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Application version mismatch")
    }
    if (!OPEN_STATUSES.includes(row.status as (typeof OPEN_STATUSES)[number])) {
      throw conflict(
        "ILLEGAL_STATE_TRANSITION",
        `Cannot request docs in status ${row.status}`,
      )
    }
    await tx
      .update(partnerApplications)
      .set({
        status: "docs_requested",
        version: row.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(partnerApplications.id, applicationId))
    if (parsed.data.message) {
      await tx.insert(partnerApplicationNotes).values({
        id: createId("apan"),
        applicationId,
        authorUserId: principal.actorUserId,
        body: parsed.data.message,
      })
    }
    await recordAudit(
      tx,
      {
        action: "partner_application.documents_requested",
        resourceType: "partner_application",
        resourceId: applicationId,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "partner_application",
      aggregateId: applicationId,
      eventType: "application.documents_requested",
      payload: { applicationId },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return { id: applicationId, status: "docs_requested" as const, version: row.version + 1 }
  })
}

export async function rejectPartnerApplication(
  principal: EffectivePrincipal,
  applicationId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requirePartnerAdmin(principal, { write: true })
  const schema = z.object({
    expectedVersion: z.number().int().positive(),
    reasonCode: z
      .enum(["incomplete_docs", "ineligible", "duplicate", "other"])
      .default("incomplete_docs"),
    message: z.string().max(1000).optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid rejection", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    const row = await tx.query.partnerApplications.findFirst({
      where: eq(partnerApplications.id, applicationId),
    })
    if (!row) throw notFound("Application not found")
    if (row.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Application version mismatch")
    }
    if (!OPEN_STATUSES.includes(row.status as (typeof OPEN_STATUSES)[number])) {
      throw conflict(
        "ILLEGAL_STATE_TRANSITION",
        `Cannot reject in status ${row.status}`,
      )
    }
    await tx
      .update(partnerApplications)
      .set({
        status: "rejected",
        decisionReasonCode: parsed.data.reasonCode,
        decisionReason: parsed.data.message ?? parsed.data.reasonCode,
        decidedAt: new Date(),
        version: row.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(partnerApplications.id, applicationId))
    await recordAudit(
      tx,
      {
        action: "partner_application.rejected",
        resourceType: "partner_application",
        resourceId: applicationId,
        tenantType: "platform",
        tenantId: "platform",
        after: { reasonCode: parsed.data.reasonCode },
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "partner_application",
      aggregateId: applicationId,
      eventType: "partner_application.rejected",
      payload: { applicationId, reasonCode: parsed.data.reasonCode },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return { id: applicationId, status: "rejected" as const, version: row.version + 1 }
  })
}

export async function approvePartnerApplication(
  principal: EffectivePrincipal,
  applicationId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requirePartnerAdmin(principal, { write: true })
  const schema = z.object({
    expectedVersion: z.number().int().positive(),
    verificationStatus: z.enum(["review", "live"]).default("review"),
    commissionTierBps: z.number().int().min(100).max(3000).default(1200),
    bookingMode: z.enum(["request", "instant"]).default("request"),
    note: z.string().max(1000).optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid approval", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    const row = await tx.query.partnerApplications.findFirst({
      where: eq(partnerApplications.id, applicationId),
    })
    if (!row) throw notFound("Application not found")
    if (row.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Application version mismatch")
    }
    if (!OPEN_STATUSES.includes(row.status as (typeof OPEN_STATUSES)[number])) {
      throw conflict(
        "ILLEGAL_STATE_TRANSITION",
        `Cannot approve in status ${row.status}`,
      )
    }

    const agencyId = createId("agy")
    let slug = slugify(row.tradeName) || `agency-${agencyId.slice(-8)}`
    const existingSlug = await tx.query.agencies.findFirst({
      where: eq(agencies.slug, slug),
    })
    if (existingSlug) slug = `${slug}-${agencyId.slice(-6)}`

    await tx.insert(agencies).values({
      id: agencyId,
      slug,
      tradeName: row.tradeName,
      legalName: row.legalName,
      city: row.city,
      contactEmail: row.email,
      contactPhone: row.phone,
      verificationStatus: parsed.data.verificationStatus,
      commissionTierBps: parsed.data.commissionTierBps,
      bookingMode: parsed.data.bookingMode,
      instantEnabled: parsed.data.bookingMode === "instant",
      publicVisibility: parsed.data.verificationStatus === "live",
    })
    await tx.insert(agencyProfilesI18n).values([
      {
        id: createId("agi18n"),
        agencyId,
        locale: "en",
        publicName: row.tradeName,
        bio: "",
        pickupDescription: "",
      },
      {
        id: createId("agi18n"),
        agencyId,
        locale: "fr",
        publicName: row.tradeName,
        bio: "",
        pickupDescription: "",
      },
    ])

    await tx
      .update(partnerApplications)
      .set({
        status: "approved",
        resultingAgencyId: agencyId,
        decidedAt: new Date(),
        version: row.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(partnerApplications.id, applicationId))

    if (parsed.data.note) {
      await tx.insert(partnerApplicationNotes).values({
        id: createId("apan"),
        applicationId,
        authorUserId: principal.actorUserId,
        body: parsed.data.note,
      })
    }

    await recordAudit(
      tx,
      {
        action: "partner_application.approved",
        resourceType: "partner_application",
        resourceId: applicationId,
        tenantType: "platform",
        tenantId: "platform",
        after: { agencyId, verificationStatus: parsed.data.verificationStatus },
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "partner_application",
      aggregateId: applicationId,
      eventType: "partner_application.approved",
      payload: { applicationId, agencyId },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    await enqueueOutbox(tx, {
      aggregateType: "agency",
      aggregateId: agencyId,
      eventType: "agency.created",
      payload: { agencyId, fromApplicationId: applicationId },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      id: applicationId,
      status: "approved" as const,
      agencyId,
      version: row.version + 1,
    }
  })
}

export async function addPartnerApplicationNote(
  principal: EffectivePrincipal,
  applicationId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requirePartnerAdmin(principal, { write: true })
  const schema = z.object({ body: z.string().min(1).max(4000) })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid note", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    const row = await tx.query.partnerApplications.findFirst({
      where: eq(partnerApplications.id, applicationId),
    })
    if (!row) throw notFound("Application not found")
    const id = createId("apan")
    await tx.insert(partnerApplicationNotes).values({
      id,
      applicationId,
      authorUserId: principal.actorUserId,
      body: parsed.data.body,
    })
    await recordAudit(
      tx,
      {
        action: "partner_application.note_added",
        resourceType: "partner_application",
        resourceId: applicationId,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { id, applicationId }
  })
}

export function hashTaxId(taxId: string) {
  return createHash("sha256").update(taxId.trim().toUpperCase()).digest("hex")
}
