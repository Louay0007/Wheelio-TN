import { and, desc, eq, or } from "drizzle-orm"
import { auditEvents, twoFactor, user } from "@/db/schema"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"

const SECURITY_ACTIONS = [
  "session.revoked",
  "sessions.revoked_others",
  "security.mfa.enabled",
  "security.mfa.disabled",
  "security.mfa.backup_codes_regenerated",
] as const

export async function getSecurityOverview(principal: EffectivePrincipal) {
  const db = getDb()
  const [identity, factor, events] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, principal.actorUserId),
      columns: { twoFactorEnabled: true },
    }),
    db.query.twoFactor.findFirst({
      where: eq(twoFactor.userId, principal.actorUserId),
      columns: { verified: true, lockedUntil: true },
    }),
    db.query.auditEvents.findMany({
      where: and(
        or(
          eq(auditEvents.actorUserId, principal.actorUserId),
          eq(auditEvents.effectiveUserId, principal.actorUserId),
        ),
      ),
      orderBy: [desc(auditEvents.occurredAt)],
      limit: 50,
    }),
  ])
  return {
    mfa: {
      enabled: Boolean(identity?.twoFactorEnabled && factor?.verified),
      lockedUntil: factor?.lockedUntil?.toISOString() ?? null,
    },
    events: events
      .filter((event) =>
        SECURITY_ACTIONS.includes(event.action as (typeof SECURITY_ACTIONS)[number]),
      )
      .slice(0, 20)
      .map((event) => ({
        id: event.id,
        action: event.action,
        occurredAt: event.occurredAt.toISOString(),
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      })),
  }
}
