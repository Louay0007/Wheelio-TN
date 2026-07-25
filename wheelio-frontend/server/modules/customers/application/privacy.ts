import { and, desc, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { privacyRequests, storedObjects } from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import { conflict, forbidden, notFound, validationError } from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { beginIdempotency, completeIdempotency, hashRequestPayload } from "@/server/core/idempotency/service"
import { enqueueJob, QUEUE_NAMES } from "@/server/core/queue/bullmq"
import { createPresignedGetUrl } from "@/server/core/storage/minio"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import { ensureProfile, findProfileByUserId } from "@/server/modules/customers/infrastructure/customer-repository"
import {
  isRecentAuthentication,
  RECENT_AUTH_MS,
  requireRecentAuthentication,
} from "@/server/core/security/guards"

export const ACTIVE_PRIVACY_STATUSES = ["pending", "queued", "processing", "awaiting_retention"] as const
export const TERMINAL_PRIVACY_STATUSES = ["completed", "failed", "cancelled"] as const
export const PRIVACY_RECENT_AUTH_MS = RECENT_AUTH_MS
export { isRecentAuthentication }

function requireStepUp(principal: EffectivePrincipal) {
  requireRecentAuthentication(principal)
}

async function requireProfile(principal: EffectivePrincipal) {
  if (principal.impersonating) throw forbidden("IMPERSONATION_READ_ONLY", "Impersonation sessions cannot request privacy actions")
  let profile = await findProfileByUserId(getDb(), principal.effectiveUserId)
  if (!profile) profile = await ensureProfile(getDb(), { userId: principal.effectiveUserId, legalName: principal.name || principal.email })
  return profile
}

export function serializePrivacyRequest(row: typeof privacyRequests.$inferSelect) {
  return {
    id: row.id,
    requestType: row.requestType as "export" | "deletion",
    status: row.status,
    dueAt: row.dueAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    artifactReady: Boolean(row.artifactObjectId && row.status === "completed"),
    artifactExpiresAt: row.artifactExpiresAt?.toISOString() ?? null,
    legalHoldReason: row.legalHoldReason,
    retentionUntil: row.retentionUntil?.toISOString() ?? null,
    failureReason: row.failureReason,
  }
}

async function createRequest(opts: { principal: EffectivePrincipal; ctx: RequestContext; type: "export" | "deletion"; payload: unknown; idempotencyKey: string | null }) {
  requireStepUp(opts.principal)
  if (!opts.idempotencyKey) throw validationError("Idempotency-Key header is required")
  const profile = await requireProfile(opts.principal)
  const result = await withTransaction(getDb(), async (tx) => {
    const gate = await beginIdempotency({ db: tx, principalKey: opts.principal.effectiveUserId, scope: `privacy.${opts.type}`, key: opts.idempotencyKey!, requestHash: hashRequestPayload(opts.payload), ttlSeconds: 60 * 60 * 24 * 30 })
    if (gate.kind === "replay") return { request: gate.responseBody as ReturnType<typeof serializePrivacyRequest>, created: false }
    if (gate.kind === "in_flight") throw conflict("VERSION_CONFLICT", "Privacy request is already being submitted")
    const active = await tx.query.privacyRequests.findFirst({ where: and(eq(privacyRequests.customerProfileId, profile.id), eq(privacyRequests.requestType, opts.type), inArray(privacyRequests.status, [...ACTIVE_PRIVACY_STATUSES])) })
    if (active) throw conflict("ILLEGAL_STATE_TRANSITION", `An active ${opts.type} request already exists`, { requestId: active.id, status: active.status })
    const id = createId("priv")
    const dueAt = new Date(Date.now() + 30 * 86400_000)
    const [row] = await tx.insert(privacyRequests).values({ id, customerProfileId: profile.id, requestType: opts.type, status: "queued", dueAt }).returning()
    const response = serializePrivacyRequest(row!)
    await recordAudit(tx, { action: `privacy.${opts.type}_requested`, resourceType: "privacy_request", resourceId: id, tenantType: "customer", tenantId: profile.id, reason: opts.type === "deletion" ? (opts.payload as { reason: string }).reason : undefined }, opts.ctx, opts.principal)
    await enqueueOutbox(tx, { aggregateType: "privacy_request", aggregateId: id, eventType: `privacy.${opts.type}_requested`, payload: { requestId: id, profileId: profile.id }, correlationId: opts.ctx.correlationId, causationId: opts.ctx.requestId })
    await completeIdempotency({ db: tx, id: gate.id, statusCode: 202, responseBody: response, resourceId: id })
    return { request: response, created: true }
  })
  if (result.created) await enqueueJob(QUEUE_NAMES.privacy, { requestId: result.request.id }, { jobId: result.request.id })
  return result.request
}

export async function requestPrivacyExport(principal: EffectivePrincipal, ctx: RequestContext, idempotencyKey: string | null) {
  return createRequest({ principal, ctx, type: "export", payload: {}, idempotencyKey })
}

export async function requestPrivacyDeletion(principal: EffectivePrincipal, rawInput: unknown, ctx: RequestContext, idempotencyKey: string | null) {
  const parsed = z.object({ reason: z.string().trim().min(3).max(500), confirm: z.literal(true) }).safeParse(rawInput)
  if (!parsed.success) throw validationError("Invalid deletion request", { issues: parsed.error.issues })
  return createRequest({ principal, ctx, type: "deletion", payload: parsed.data, idempotencyKey })
}

export async function listPrivacyRequests(principal: EffectivePrincipal) {
  const profile = await requireProfile(principal)
  const rows = await getDb().query.privacyRequests.findMany({ where: eq(privacyRequests.customerProfileId, profile.id), orderBy: [desc(privacyRequests.createdAt)], limit: 50 })
  return rows.map(serializePrivacyRequest)
}

export async function getPrivacyRequest(principal: EffectivePrincipal, requestId: string) {
  const profile = await requireProfile(principal)
  const row = await getDb().query.privacyRequests.findFirst({ where: and(eq(privacyRequests.id, requestId), eq(privacyRequests.customerProfileId, profile.id)) })
  if (!row) throw notFound("Privacy request not found")
  return serializePrivacyRequest(row)
}

export async function getPrivacyArtifactDownload(principal: EffectivePrincipal, requestId: string) {
  requireStepUp(principal)
  const profile = await requireProfile(principal)
  const request = await getDb().query.privacyRequests.findFirst({ where: and(eq(privacyRequests.id, requestId), eq(privacyRequests.customerProfileId, profile.id), eq(privacyRequests.requestType, "export"), eq(privacyRequests.status, "completed")) })
  if (!request?.artifactObjectId || (request.artifactExpiresAt && request.artifactExpiresAt <= new Date())) throw notFound("Export artifact is unavailable or expired")
  const object = await getDb().query.storedObjects.findFirst({ where: and(eq(storedObjects.id, request.artifactObjectId), eq(storedObjects.ownerType, "privacy_request"), eq(storedObjects.ownerId, request.id), eq(storedObjects.classification, "private")) })
  if (!object || object.deletedAt) throw notFound("Export artifact not found")
  return createPresignedGetUrl({ bucket: object.bucket, objectKey: object.objectKey, expiresSeconds: 300 })
}
