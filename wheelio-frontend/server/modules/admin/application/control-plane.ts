import { and, eq } from "drizzle-orm"
import { z } from "zod"
import {
  analyticsRollups,
  cmsEntries,
  cmsPublications,
  cmsRevisions,
  impersonationGrants,
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

function requireAdmin(principal: EffectivePrincipal, roles?: string[]) {
  if (principal.actorClass !== "admin" || !principal.adminMembership) {
    throw forbidden("FORBIDDEN", "Admin role required")
  }
  if (roles && !roles.includes(principal.adminMembership.role)) {
    throw forbidden("FORBIDDEN", "Insufficient admin role")
  }
  return principal.adminMembership
}

export async function issueImpersonationGrant(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, ["super", "support"])
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Cannot nest impersonation grants",
    )
  }
  const schema = z.object({
    targetType: z.enum(["customer", "agency"]),
    targetId: z.string().min(1),
    reason: z.string().min(8).max(500),
    ticket: z.string().max(80).optional(),
    ttlMinutes: z.number().int().positive().max(120).default(30),
    allowedScopes: z.array(z.string()).default(["read"]),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid impersonation grant", {
      issues: parsed.error.issues,
    })
  }
  if (parsed.data.allowedScopes.some((s) => s !== "read")) {
    throw validationError("Impersonation is read-only; only read scopes allowed")
  }

  return withTransaction(getDb(), async (tx) => {
    const id = createId("imp")
    const expiresAt = new Date(
      Date.now() + parsed.data.ttlMinutes * 60 * 1000,
    )
    await tx.insert(impersonationGrants).values({
      id,
      adminUserId: principal.actorUserId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      ticket: parsed.data.ticket,
      allowedScopesJson: ["read"],
      expiresAt,
    })
    await recordAudit(
      tx,
      {
        action: "admin.impersonation_issued",
        resourceType: "impersonation_grant",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
        after: {
          targetType: parsed.data.targetType,
          targetId: parsed.data.targetId,
          expiresAt: expiresAt.toISOString(),
        },
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "impersonation_grant",
      aggregateId: id,
      eventType: "admin.impersonation_issued",
      payload: { grantId: id },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return {
      grantId: id,
      expiresAt: expiresAt.toISOString(),
      allowedScopes: ["read"] as const,
      writeAllowed: false as const,
    }
  })
}

export async function stopImpersonationGrant(
  principal: EffectivePrincipal,
  grantId: string,
  ctx: RequestContext,
) {
  requireAdmin(principal, ["super", "support"])
  return withTransaction(getDb(), async (tx) => {
    const grant = await tx.query.impersonationGrants.findFirst({
      where: eq(impersonationGrants.id, grantId),
    })
    if (!grant) throw notFound("Impersonation grant not found")
    if (grant.adminUserId !== principal.actorUserId && principal.adminMembership?.role !== "super") {
      throw forbidden("FORBIDDEN", "Cannot stop another admin's grant")
    }
    await tx
      .update(impersonationGrants)
      .set({ stoppedAt: new Date() })
      .where(eq(impersonationGrants.id, grantId))
    await recordAudit(
      tx,
      {
        action: "admin.impersonation_stopped",
        resourceType: "impersonation_grant",
        resourceId: grantId,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { grantId, stopped: true as const }
  })
}

export async function createCmsRevision(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, ["super", "content", "support"])
  if (principal.impersonating) {
    throw forbidden("IMPERSONATION_READ_ONLY", "Impersonation cannot edit CMS")
  }
  const schema = z.object({
    kind: z.enum(["page", "faq", "guide", "help", "legal"]),
    slug: z.string().min(1).max(120),
    locale: z.enum(["en", "fr"]),
    title: z.string().min(1).max(200),
    body: z.string().min(1),
    publish: z.boolean().default(false),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid CMS revision", {
      issues: parsed.error.issues,
    })
  }

  return withTransaction(getDb(), async (tx) => {
    let entry = await tx.query.cmsEntries.findFirst({
      where: and(
        eq(cmsEntries.kind, parsed.data.kind),
        eq(cmsEntries.slug, parsed.data.slug),
      ),
    })
    if (!entry) {
      const entryId = createId("cms")
      await tx.insert(cmsEntries).values({
        id: entryId,
        kind: parsed.data.kind,
        slug: parsed.data.slug,
        status: "draft",
      })
      entry = await tx.query.cmsEntries.findFirst({
        where: eq(cmsEntries.id, entryId),
      })
    }
    if (!entry) throw notFound("CMS entry missing after create")

    const latest = await tx.query.cmsRevisions.findMany({
      where: and(
        eq(cmsRevisions.entryId, entry.id),
        eq(cmsRevisions.locale, parsed.data.locale),
      ),
    })
    const nextRev =
      latest.reduce((max, r) => Math.max(max, r.revision), 0) + 1
    const revisionId = createId("cmr")
    await tx.insert(cmsRevisions).values({
      id: revisionId,
      entryId: entry.id,
      revision: nextRev,
      locale: parsed.data.locale,
      title: parsed.data.title,
      body: parsed.data.body,
      contentHash: `${parsed.data.slug}|${parsed.data.locale}|${nextRev}`,
      authorUserId: principal.actorUserId,
    })

    if (parsed.data.publish) {
      await tx.insert(cmsPublications).values({
        id: createId("cmp"),
        entryId: entry.id,
        revisionId,
        locale: parsed.data.locale,
        publishedAt: new Date(),
      })
      await tx
        .update(cmsEntries)
        .set({
          status: "published",
          currentRevisionId: revisionId,
          updatedAt: new Date(),
        })
        .where(eq(cmsEntries.id, entry.id))
    }

    await recordAudit(
      tx,
      {
        action: "cms.revision_created",
        resourceType: "cms_entry",
        resourceId: entry.id,
        tenantType: "platform",
        tenantId: "platform",
        after: {
          revisionId,
          locale: parsed.data.locale,
          published: parsed.data.publish,
        },
      },
      ctx,
      principal,
    )

    return {
      entryId: entry.id,
      revisionId,
      revision: nextRev,
      locale: parsed.data.locale,
      published: parsed.data.publish,
    }
  })
}

/**
 * GMV / commission rollups intentionally exclude deposit millimes.
 */
export async function rebuildAnalyticsRollups(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, ["super", "finance", "readonly_analyst"])
  const schema = z.object({
    periodStart: z.string().datetime({ offset: true }),
    periodEnd: z.string().datetime({ offset: true }),
    agencyId: z.string().optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid analytics rebuild", {
      issues: parsed.error.issues,
    })
  }

  return withTransaction(getDb(), async (tx) => {
    const periodStart = new Date(parsed.data.periodStart)
    const periodEnd = new Date(parsed.data.periodEnd)
    const { sql } = await import("drizzle-orm")
    const gmv = await tx.execute(sql`
      SELECT coalesce(sum(bs.commissionable_millimes), 0)::bigint AS gmv,
             coalesce(sum(bs.commission_millimes), 0)::bigint AS commission,
             coalesce(sum(bs.deposit_millimes), 0)::bigint AS deposit_memo
      FROM bookings b
      INNER JOIN booking_snapshots bs ON bs.booking_id = b.id
      WHERE b.created_at >= ${periodStart}
        AND b.created_at < ${periodEnd}
        AND b.status NOT IN ('cancelled')
        ${
          parsed.data.agencyId
            ? sql`AND b.agency_id = ${parsed.data.agencyId}`
            : sql``
        }
    `)
    const row =
      (
        gmv as unknown as {
          rows?: Array<{
            gmv: string | number | bigint
            commission: string | number | bigint
            deposit_memo: string | number | bigint
          }>
        }
      ).rows?.[0] ?? {
        gmv: 0,
        commission: 0,
        deposit_memo: 0,
      }

    const gmvId = createId("anr")
    const commissionId = createId("anr")
    await tx.insert(analyticsRollups).values([
      {
        id: gmvId,
        metricKey: "gmv_commissionable",
        periodStart,
        periodEnd,
        dimensionsJson: { agencyId: parsed.data.agencyId ?? null },
        valueMillimes: BigInt(row.gmv),
        includesDeposit: false,
      },
      {
        id: commissionId,
        metricKey: "commission",
        periodStart,
        periodEnd,
        dimensionsJson: { agencyId: parsed.data.agencyId ?? null },
        valueMillimes: BigInt(row.commission),
        includesDeposit: false,
      },
    ])

    await recordAudit(
      tx,
      {
        action: "analytics.rollups_rebuilt",
        resourceType: "analytics_rollup",
        resourceId: gmvId,
        tenantType: "platform",
        tenantId: "platform",
        after: {
          gmvMillimes: String(row.gmv),
          commissionMillimes: String(row.commission),
          depositMemoObservedButExcluded: String(row.deposit_memo),
          includesDeposit: false,
        },
      },
      ctx,
      principal,
    )

    return {
      gmvMillimes: String(row.gmv),
      commissionMillimes: String(row.commission),
      depositMemoObservedButExcluded: String(row.deposit_memo),
      includesDeposit: false as const,
      rollupIds: [gmvId, commissionId],
    }
  })
}
