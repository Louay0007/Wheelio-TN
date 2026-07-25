import { and, eq, gt, ne } from "drizzle-orm"
import { session } from "@/db/schema"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import { forbidden, notFound } from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import {
  enforceSensitiveCommandRateLimit,
  requireRecentAuthentication,
} from "@/server/core/security/guards"

export async function listSessions(principal: EffectivePrincipal) {
  const db = getDb()
  const rows = await db.query.session.findMany({
    where: and(
      eq(session.userId, principal.actorUserId),
      gt(session.expiresAt, new Date()),
    ),
  })
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    current: row.id === principal.sessionId,
  }))
}

export async function revokeSession(
  principal: EffectivePrincipal,
  sessionId: string,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation sessions cannot revoke sessions",
    )
  }
  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.session.findFirst({
      where: and(
        eq(session.id, sessionId),
        eq(session.userId, principal.actorUserId),
      ),
    })
    if (!existing) throw notFound("Session not found")
    await tx.delete(session).where(eq(session.id, sessionId))
    await recordAudit(
      tx,
      {
        action: "session.revoked",
        resourceType: "session",
        resourceId: sessionId,
        tenantType: principal.tenantType,
        tenantId: principal.tenantId,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "session",
      aggregateId: sessionId,
      eventType: "session.revoked",
      payload: { sessionId, userId: principal.actorUserId },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return { revoked: true as const }
  })
}

export async function revokeOtherSessions(
  principal: EffectivePrincipal,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation sessions cannot revoke sessions",
    )
  }
  if (!principal.sessionId) {
    throw forbidden("FORBIDDEN", "Current session is required")
  }
  requireRecentAuthentication(principal)
  await enforceSensitiveCommandRateLimit({
    principal,
    command: "sessions.revoke-others",
    limit: 3,
    windowSeconds: 60,
  })
  return withTransaction(getDb(), async (tx) => {
    await tx
      .delete(session)
      .where(
        and(
          eq(session.userId, principal.actorUserId),
          ne(session.id, principal.sessionId!),
        ),
      )
    await recordAudit(
      tx,
      {
        action: "sessions.revoked_others",
        resourceType: "user",
        resourceId: principal.actorUserId,
        tenantType: principal.tenantType,
        tenantId: principal.tenantId,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "user",
      aggregateId: principal.actorUserId,
      eventType: "sessions.revoked",
      payload: { keepSessionId: principal.sessionId },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return { revokedOthers: true as const }
  })
}
