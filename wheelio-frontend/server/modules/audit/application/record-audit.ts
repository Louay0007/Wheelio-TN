import { createHash } from "node:crypto"
import { auditEvents } from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import type { Database } from "@/server/core/database/client"
import type { DbTransaction } from "@/server/core/database/transaction"
import type { RequestContext } from "@/server/core/http/request-context"
import type { EffectivePrincipal } from "@/server/core/auth/principal"

type AuditTx = Database | DbTransaction

export type AuditInput = {
  action: string
  resourceType: string
  resourceId?: string | null
  tenantType?: string | null
  tenantId?: string | null
  reason?: string | null
  ticket?: string | null
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown>
  actorClass?: string
  actorUserId?: string | null
  effectiveUserId?: string | null
}

export function digestPayload(value: unknown) {
  if (value === undefined) return null
  return createHash("sha256")
    .update(JSON.stringify(value ?? null))
    .digest("hex")
}

export async function recordAudit(
  db: AuditTx,
  input: AuditInput,
  ctx: RequestContext,
  principal?: EffectivePrincipal | null,
) {
  const id = createId("aud")
  await db.insert(auditEvents).values({
    id,
    actorUserId: input.actorUserId ?? principal?.actorUserId ?? null,
    effectiveUserId:
      input.effectiveUserId ?? principal?.effectiveUserId ?? null,
    actorClass:
      input.actorClass ??
      principal?.actorClass ??
      (principal ? "user" : "system"),
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    tenantType: input.tenantType ?? principal?.tenantType ?? null,
    tenantId: input.tenantId ?? principal?.tenantId ?? null,
    reason: input.reason ?? null,
    ticket: input.ticket ?? null,
    requestId: ctx.requestId,
    correlationId: ctx.correlationId,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    beforeDigest: digestPayload(input.before),
    afterDigest: digestPayload(input.after),
    metadata: input.metadata ?? {},
  })
  return id
}
