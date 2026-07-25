import { createHash, randomBytes } from "node:crypto"
import { and, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import {
  adminAgencyNotes,
  adminMemberships,
  adminStaffInvitations,
  agencies,
  agencyMemberships,
  auditEvents,
  claimNotes,
  claims,
  featureFlags,
  invoices,
  locations,
  locationTranslations,
  promotions,
  reconciliationRuns,
  user,
  vehicles,
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

function requireAdmin(principal: EffectivePrincipal, write = false) {
  if (write && principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot mutate admin resources",
    )
  }
  if (!principal.adminMembership || principal.adminMembership.status !== "active") {
    throw forbidden("FORBIDDEN", "Admin membership required")
  }
  return principal.adminMembership
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function listAdminAgencies(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.agencies.findMany({
    orderBy: [desc(agencies.updatedAt)],
    limit: 200,
  })
  return rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    legalName: a.legalName,
    tradeName: a.tradeName,
    verificationStatus: a.verificationStatus,
    commissionTierBps: a.commissionTierBps,
    instantEnabled: a.instantEnabled,
    createdAt: a.createdAt.toISOString(),
  }))
}

export async function getAdminAgency(
  principal: EffectivePrincipal,
  agencyId: string,
) {
  requireAdmin(principal)
  const db = getDb()
  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.id, agencyId),
  })
  if (!agency) throw notFound("Agency not found")
  const [fleet, staff, notes] = await Promise.all([
    db.query.vehicles.findMany({
      where: eq(vehicles.agencyId, agencyId),
      limit: 100,
    }),
    db.query.agencyMemberships.findMany({
      where: eq(agencyMemberships.agencyId, agencyId),
    }),
    db.query.adminAgencyNotes.findMany({
      where: eq(adminAgencyNotes.agencyId, agencyId),
      orderBy: [desc(adminAgencyNotes.createdAt)],
      limit: 50,
    }),
  ])
  return {
    id: agency.id,
    slug: agency.slug,
    legalName: agency.legalName,
    tradeName: agency.tradeName,
    verificationStatus: agency.verificationStatus,
    commissionTierBps: agency.commissionTierBps,
    instantEnabled: agency.instantEnabled,
    fleet: fleet.map((v) => ({
      id: v.id,
      make: v.make,
      model: v.model,
      status: v.status,
      categoryCode: v.categoryCode,
    })),
    staff: staff.map((s) => ({
      id: s.id,
      userId: s.userId,
      role: s.role,
      status: s.status,
    })),
    notes: notes.map((n) => ({
      id: n.id,
      body: n.body,
      authorUserId: n.authorUserId,
      createdAt: n.createdAt.toISOString(),
    })),
  }
}

export async function updateAdminAgency(
  principal: EffectivePrincipal,
  agencyId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    verificationStatus: z
      .enum(["draft", "pending", "verified", "suspended", "rejected"])
      .optional(),
    commissionTierBps: z.number().int().min(0).max(10000).optional(),
    instantEnabled: z.boolean().optional(),
    publicVisibility: z.boolean().optional(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid agency update", {
      issues: parsed.error.issues,
    })
  }
  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.agencies.findFirst({
      where: eq(agencies.id, agencyId),
    })
    if (!existing) throw notFound("Agency not found")
    const [updated] = await tx
      .update(agencies)
      .set({ ...parsed.data })
      .where(eq(agencies.id, agencyId))
      .returning()
    await recordAudit(
      tx,
      {
        action: "admin.agency.updated",
        resourceType: "agency",
        resourceId: agencyId,
        tenantType: "platform",
        tenantId: "platform",
        before: {
          verificationStatus: existing.verificationStatus,
          commissionTierBps: existing.commissionTierBps,
        },
        after: parsed.data,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "agency",
      aggregateId: agencyId,
      eventType: "admin.agency.updated",
      payload: { agencyId, ...parsed.data },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return {
      id: updated.id,
      verificationStatus: updated.verificationStatus,
      commissionTierBps: updated.commissionTierBps,
      instantEnabled: updated.instantEnabled,
    }
  })
}

export async function addAdminAgencyNote(
  principal: EffectivePrincipal,
  agencyId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({ body: z.string().min(1).max(4000) })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid note", { issues: parsed.error.issues })
  }
  const agency = await getDb().query.agencies.findFirst({
    where: eq(agencies.id, agencyId),
  })
  if (!agency) throw notFound("Agency not found")
  const id = createId("aan")
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(adminAgencyNotes).values({
      id,
      agencyId,
      authorUserId: principal.actorUserId,
      body: parsed.data.body,
    })
    await recordAudit(
      tx,
      {
        action: "admin.agency.note_added",
        resourceType: "admin_agency_note",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
  })
  return { id, agencyId, body: parsed.data.body }
}

export async function listClaims(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.claims.findMany({
    orderBy: [desc(claims.updatedAt)],
    limit: 100,
  })
  return rows.map((c) => ({
    id: c.id,
    status: c.status,
    claimType: c.claimType,
    bookingId: c.bookingId,
    agencyId: c.agencyId,
    amountClaimedMillimes: c.amountClaimedMillimes.toString(),
    amountApprovedMillimes: c.amountApprovedMillimes.toString(),
    touchesDeposit: c.touchesDeposit,
    summary: c.summary,
    version: c.version,
    updatedAt: c.updatedAt.toISOString(),
  }))
}

export async function getClaim(principal: EffectivePrincipal, claimId: string) {
  requireAdmin(principal)
  const claim = await getDb().query.claims.findFirst({
    where: eq(claims.id, claimId),
  })
  if (!claim) throw notFound("Claim not found")
  const notes = await getDb().query.claimNotes.findMany({
    where: eq(claimNotes.claimId, claimId),
    orderBy: [desc(claimNotes.createdAt)],
  })
  return {
    ...claim,
    amountClaimedMillimes: claim.amountClaimedMillimes.toString(),
    amountApprovedMillimes: claim.amountApprovedMillimes.toString(),
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
    notes: notes.map((n) => ({
      id: n.id,
      body: n.body,
      fromStatus: n.fromStatus,
      toStatus: n.toStatus,
      authorUserId: n.authorUserId,
      createdAt: n.createdAt.toISOString(),
    })),
  }
}

export async function createClaim(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    bookingId: z.string().optional(),
    agencyId: z.string().optional(),
    customerProfileId: z.string().optional(),
    claimType: z.enum(["damage", "theft", "other"]).default("damage"),
    amountClaimedMillimes: z.string().regex(/^\d+$/),
    summary: z.string().min(3).max(500),
    touchesDeposit: z.boolean().default(true),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid claim", { issues: parsed.error.issues })
  }
  const id = createId("clm")
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(claims).values({
      id,
      bookingId: parsed.data.bookingId,
      agencyId: parsed.data.agencyId,
      customerProfileId: parsed.data.customerProfileId,
      claimType: parsed.data.claimType,
      amountClaimedMillimes: BigInt(parsed.data.amountClaimedMillimes),
      summary: parsed.data.summary,
      touchesDeposit: parsed.data.touchesDeposit,
      ownerUserId: principal.actorUserId,
    })
    await recordAudit(
      tx,
      {
        action: "admin.claim.created",
        resourceType: "claim",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
  })
  return { id, status: "open" }
}

export async function updateClaim(
  principal: EffectivePrincipal,
  claimId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    status: z
      .enum(["open", "investigating", "approved", "rejected", "closed"])
      .optional(),
    amountApprovedMillimes: z.string().regex(/^\d+$/).optional(),
    note: z.string().min(1).max(4000).optional(),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid claim update", {
      issues: parsed.error.issues,
    })
  }
  return withTransaction(getDb(), async (tx) => {
    const claim = await tx.query.claims.findFirst({
      where: eq(claims.id, claimId),
    })
    if (!claim) throw notFound("Claim not found")
    if (claim.version !== parsed.data.expectedVersion) {
      throw validationError("Version conflict", {
        expected: parsed.data.expectedVersion,
        actual: claim.version,
      })
    }
    const nextStatus = parsed.data.status ?? claim.status
    const [updated] = await tx
      .update(claims)
      .set({
        status: nextStatus,
        amountApprovedMillimes: parsed.data.amountApprovedMillimes
          ? BigInt(parsed.data.amountApprovedMillimes)
          : claim.amountApprovedMillimes,
        version: claim.version + 1,
      })
      .where(eq(claims.id, claimId))
      .returning()
    if (parsed.data.note || parsed.data.status) {
      await tx.insert(claimNotes).values({
        id: createId("cln"),
        claimId,
        authorUserId: principal.actorUserId,
        body: parsed.data.note ?? `Status → ${nextStatus}`,
        fromStatus: claim.status,
        toStatus: nextStatus,
      })
    }
    await recordAudit(
      tx,
      {
        action: "admin.claim.updated",
        resourceType: "claim",
        resourceId: claimId,
        tenantType: "platform",
        tenantId: "platform",
        before: { status: claim.status },
        after: { status: updated.status },
      },
      ctx,
      principal,
    )
    return {
      id: updated.id,
      status: updated.status,
      version: updated.version,
      amountApprovedMillimes: updated.amountApprovedMillimes.toString(),
    }
  })
}

export async function listFeatureFlags(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.featureFlags.findMany({
    orderBy: [desc(featureFlags.updatedAt)],
  })
  return rows.map((f) => ({
    id: f.id,
    key: f.key,
    description: f.description,
    enabled: f.enabled,
    audience: f.audience,
    version: f.version,
  }))
}

export async function upsertFeatureFlag(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    key: z.string().min(2).max(80),
    description: z.string().max(400).optional(),
    enabled: z.boolean(),
    audience: z.enum(["all", "admin", "agency", "customer"]).default("all"),
    expectedVersion: z.number().int().positive().optional(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid flag", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.featureFlags.findFirst({
      where: eq(featureFlags.key, parsed.data.key),
    })
    if (existing) {
      if (
        parsed.data.expectedVersion &&
        existing.version !== parsed.data.expectedVersion
      ) {
        throw validationError("Version conflict", {
          expected: parsed.data.expectedVersion,
          actual: existing.version,
        })
      }
      const [updated] = await tx
        .update(featureFlags)
        .set({
          enabled: parsed.data.enabled,
          description: parsed.data.description ?? existing.description,
          audience: parsed.data.audience,
          version: existing.version + 1,
        })
        .where(eq(featureFlags.id, existing.id))
        .returning()
      await recordAudit(
        tx,
        {
          action: "admin.feature_flag.updated",
          resourceType: "feature_flag",
          resourceId: existing.id,
          tenantType: "platform",
          tenantId: "platform",
          after: { enabled: updated.enabled },
        },
        ctx,
        principal,
      )
      return {
        id: updated.id,
        key: updated.key,
        enabled: updated.enabled,
        version: updated.version,
      }
    }
    const id = createId("ffg")
    await tx.insert(featureFlags).values({
      id,
      key: parsed.data.key,
      description: parsed.data.description,
      enabled: parsed.data.enabled,
      audience: parsed.data.audience,
    })
    await recordAudit(
      tx,
      {
        action: "admin.feature_flag.created",
        resourceType: "feature_flag",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { id, key: parsed.data.key, enabled: parsed.data.enabled, version: 1 }
  })
}

export async function listPromotions(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.promotions.findMany({
    orderBy: [desc(promotions.updatedAt)],
    limit: 100,
  })
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    nameEn: p.nameEn,
    nameFr: p.nameFr,
    discountBps: p.discountBps,
    status: p.status,
    appliesToDeposit: p.appliesToDeposit,
    version: p.version,
  }))
}

export async function upsertPromotion(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    id: z.string().optional(),
    code: z.string().min(2).max(40),
    nameEn: z.string().min(2).max(120),
    nameFr: z.string().min(2).max(120),
    discountBps: z.number().int().min(0).max(10000),
    status: z.enum(["draft", "active", "paused", "expired"]).default("draft"),
    expectedVersion: z.number().int().positive().optional(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid promotion", { issues: parsed.error.issues })
  }
  if (parsed.data.id) {
    return withTransaction(getDb(), async (tx) => {
      const existing = await tx.query.promotions.findFirst({
        where: eq(promotions.id, parsed.data.id!),
      })
      if (!existing) throw notFound("Promotion not found")
      if (
        parsed.data.expectedVersion &&
        existing.version !== parsed.data.expectedVersion
      ) {
        throw validationError("Version conflict")
      }
      const [updated] = await tx
        .update(promotions)
        .set({
          code: parsed.data.code,
          nameEn: parsed.data.nameEn,
          nameFr: parsed.data.nameFr,
          discountBps: parsed.data.discountBps,
          status: parsed.data.status,
          appliesToDeposit: false,
          version: existing.version + 1,
        })
        .where(eq(promotions.id, existing.id))
        .returning()
      await recordAudit(
        tx,
        {
          action: "admin.promotion.updated",
          resourceType: "promotion",
          resourceId: existing.id,
          tenantType: "platform",
          tenantId: "platform",
        },
        ctx,
        principal,
      )
      return { id: updated.id, code: updated.code, version: updated.version }
    })
  }
  const id = createId("prm")
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(promotions).values({
      id,
      code: parsed.data.code,
      nameEn: parsed.data.nameEn,
      nameFr: parsed.data.nameFr,
      discountBps: parsed.data.discountBps,
      status: parsed.data.status,
      appliesToDeposit: false,
    })
    await recordAudit(
      tx,
      {
        action: "admin.promotion.created",
        resourceType: "promotion",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
  })
  return { id, code: parsed.data.code, version: 1 }
}

export async function listAdminLocations(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.locations.findMany({
    orderBy: [desc(locations.updatedAt)],
    limit: 200,
  })
  return rows.map((l) => ({
    id: l.id,
    slug: l.slug,
    type: l.type,
    region: l.region,
    status: l.status,
    searchPickup: l.searchPickup,
  }))
}

export async function upsertAdminLocation(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    id: z.string().optional(),
    slug: z.string().min(2).max(80),
    type: z.enum(["airport", "city", "station"]).default("city"),
    region: z.string().min(2).max(80),
    searchPickup: z.string().min(2).max(120),
    status: z.enum(["draft", "published", "archived"]).default("published"),
    nameEn: z.string().min(2).max(120),
    nameFr: z.string().min(2).max(120),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid location", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    if (parsed.data.id) {
      const [updated] = await tx
        .update(locations)
        .set({
          slug: parsed.data.slug,
          type: parsed.data.type,
          region: parsed.data.region,
          searchPickup: parsed.data.searchPickup,
          status: parsed.data.status,
        })
        .where(eq(locations.id, parsed.data.id))
        .returning()
      if (!updated) throw notFound("Location not found")
      await recordAudit(
        tx,
        {
          action: "admin.location.updated",
          resourceType: "location",
          resourceId: updated.id,
          tenantType: "platform",
          tenantId: "platform",
        },
        ctx,
        principal,
      )
      return { id: updated.id, slug: updated.slug }
    }
    const id = createId("loc")
    await tx.insert(locations).values({
      id,
      slug: parsed.data.slug,
      type: parsed.data.type,
      region: parsed.data.region,
      searchPickup: parsed.data.searchPickup,
      status: parsed.data.status,
    })
    await tx.insert(locationTranslations).values([
      {
        id: createId("ltr"),
        locationId: id,
        locale: "en",
        name: parsed.data.nameEn,
        shortName: parsed.data.nameEn,
        blurb: parsed.data.nameEn,
        intro: parsed.data.nameEn,
      },
      {
        id: createId("ltr"),
        locationId: id,
        locale: "fr",
        name: parsed.data.nameFr,
        shortName: parsed.data.nameFr,
        blurb: parsed.data.nameFr,
        intro: parsed.data.nameFr,
      },
    ])
    await recordAudit(
      tx,
      {
        action: "admin.location.created",
        resourceType: "location",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { id, slug: parsed.data.slug }
  })
}

export async function listInvoicesAdmin(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.invoices.findMany({
    where: eq(invoices.includesDeposit, false),
    orderBy: [desc(invoices.createdAt)],
    limit: 100,
  })
  return rows.map((i) => ({
    id: i.id,
    agencyId: i.agencyId,
    bookingId: i.bookingId,
    kind: i.kind,
    status: i.status,
    totalMillimes: i.totalMillimes.toString(),
    includesDeposit: i.includesDeposit,
    issuedAt: i.issuedAt?.toISOString() ?? null,
  }))
}

export async function createInvoiceStub(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    agencyId: z.string(),
    bookingId: z.string().optional(),
    kind: z.enum(["commission", "adjustment"]).default("commission"),
    subtotalMillimes: z.string().regex(/^\d+$/),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid invoice", { issues: parsed.error.issues })
  }
  const subtotal = BigInt(parsed.data.subtotalMillimes)
  const id = createId("inv")
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(invoices).values({
      id,
      agencyId: parsed.data.agencyId,
      bookingId: parsed.data.bookingId,
      kind: parsed.data.kind,
      subtotalMillimes: subtotal,
      totalMillimes: subtotal,
      includesDeposit: false,
      status: "issued",
      issuedAt: new Date(),
      pdfObjectId: null,
    })
    await recordAudit(
      tx,
      {
        action: "admin.invoice.created",
        resourceType: "invoice",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
        metadata: { includesDeposit: false },
      },
      ctx,
      principal,
    )
  })
  return { id, includesDeposit: false, totalMillimes: subtotal.toString() }
}

export async function listReconciliation(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.reconciliationRuns.findMany({
    orderBy: [desc(reconciliationRuns.createdAt)],
    limit: 50,
  })
  return rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    status: r.status,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    matchedCount: r.matchedCount,
    unmatchedCount: r.unmatchedCount,
  }))
}

export async function createReconciliationRun(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
    notes: z.string().max(1000).optional(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid reconciliation run", {
      issues: parsed.error.issues,
    })
  }
  const id = createId("rec")
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(reconciliationRuns).values({
      id,
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
      notes: parsed.data.notes,
      createdByUserId: principal.actorUserId,
      matchedCount: 0,
      unmatchedCount: 0,
    })
    await recordAudit(
      tx,
      {
        action: "admin.reconciliation.created",
        resourceType: "reconciliation_run",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
  })
  return { id, status: "open" }
}

export async function closeReconciliationRun(
  principal: EffectivePrincipal,
  runId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    matchedCount: z.number().int().min(0),
    unmatchedCount: z.number().int().min(0),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid close payload", {
      issues: parsed.error.issues,
    })
  }
  return withTransaction(getDb(), async (tx) => {
    const run = await tx.query.reconciliationRuns.findFirst({
      where: eq(reconciliationRuns.id, runId),
    })
    if (!run) throw notFound("Reconciliation run not found")
    const [updated] = await tx
      .update(reconciliationRuns)
      .set({
        status: "closed",
        matchedCount: parsed.data.matchedCount,
        unmatchedCount: parsed.data.unmatchedCount,
        closedAt: new Date(),
      })
      .where(eq(reconciliationRuns.id, runId))
      .returning()
    await recordAudit(
      tx,
      {
        action: "admin.reconciliation.closed",
        resourceType: "reconciliation_run",
        resourceId: runId,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { id: updated.id, status: updated.status }
  })
}

export async function listAuditEvents(
  principal: EffectivePrincipal,
  opts?: { limit?: number },
) {
  requireAdmin(principal)
  const limit = Math.min(opts?.limit ?? 50, 200)
  const rows = await getDb().query.auditEvents.findMany({
    orderBy: [desc(auditEvents.occurredAt)],
    limit,
  })
  return rows.map((e) => ({
    id: e.id,
    action: e.action,
    resourceType: e.resourceType,
    resourceId: e.resourceId,
    actorUserId: e.actorUserId,
    occurredAt: e.occurredAt.toISOString(),
    requestId: e.requestId,
  }))
}

export async function listAdminStaff(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const db = getDb()
  const members = await db
    .select({
      id: adminMemberships.id,
      userId: adminMemberships.userId,
      role: adminMemberships.role,
      status: adminMemberships.status,
      email: user.email,
      name: user.name,
    })
    .from(adminMemberships)
    .innerJoin(user, eq(user.id, adminMemberships.userId))
  const invites = await db.query.adminStaffInvitations.findMany({
    where: eq(adminStaffInvitations.status, "pending"),
  })
  return {
    members,
    invitations: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt.toISOString(),
    })),
  }
}

export async function inviteAdminStaff(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    email: z.string().email(),
    role: z.enum([
      "super",
      "ops",
      "finance",
      "support",
      "content",
      "readonly",
    ]),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid staff invite", {
      issues: parsed.error.issues,
    })
  }
  const token = randomBytes(24).toString("hex")
  const id = createId("asi")
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(adminStaffInvitations).values({
      id,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      tokenHash: hashToken(token),
      invitedByUserId: principal.actorUserId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    await recordAudit(
      tx,
      {
        action: "admin.staff.invited",
        resourceType: "admin_staff_invitation",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
  })
  return { id, email: parsed.data.email, role: parsed.data.role, inviteToken: token }
}

export async function listCommissions(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb()
    .select({
      agencyId: invoices.agencyId,
      totalMillimes: sql<string>`coalesce(sum(${invoices.totalMillimes}), 0)`.as(
        "total_millimes",
      ),
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(invoices)
    .where(
      and(eq(invoices.kind, "commission"), eq(invoices.includesDeposit, false)),
    )
    .groupBy(invoices.agencyId)
  return rows.map((r) => ({
    agencyId: r.agencyId,
    totalMillimes: String(r.totalMillimes),
    invoiceCount: r.count,
    includesDeposit: false,
  }))
}
