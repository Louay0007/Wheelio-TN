import { AppError, forbidden } from "@/server/core/errors/app-error"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getRedis } from "@/server/core/queue/redis"
import { getLogger } from "@/server/core/observability/logger"

export const RECENT_AUTH_MS = 15 * 60 * 1000

export function isRecentAuthentication(createdAt: Date | null, now = new Date()) {
  return Boolean(
    createdAt &&
      now.getTime() >= createdAt.getTime() &&
      now.getTime() - createdAt.getTime() <= RECENT_AUTH_MS,
  )
}

export function requireRecentAuthentication(principal: EffectivePrincipal) {
  if (!isRecentAuthentication(principal.sessionCreatedAt)) {
    throw forbidden("STEP_UP_REQUIRED", "Please re-authenticate before continuing", {
      maxAgeSeconds: RECENT_AUTH_MS / 1000,
      provider: "better-auth",
    })
  }
}

export async function enforceSensitiveCommandRateLimit(opts: {
  principal: EffectivePrincipal
  command: string
  limit?: number
  windowSeconds?: number
}) {
  const limit = opts.limit ?? 5
  const windowSeconds = opts.windowSeconds ?? 60
  const key = `security:command:${opts.command}:${opts.principal.actorUserId}`
  try {
    const redis = getRedis()
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSeconds)
    if (count > limit) {
      throw new AppError({
        code: "RATE_LIMITED",
        message: "Too many security requests. Try again shortly.",
        status: 429,
        details: { retryAfterSeconds: await redis.ttl(key) },
      })
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    // Availability failures must not silently remove protection on sensitive writes.
    getLogger().warn({ err: error, command: opts.command }, "Security rate limiter unavailable")
    throw new AppError({
      code: "TEMPORARY_UNAVAILABLE",
      message: "Security service is temporarily unavailable",
      status: 503,
    })
  }
}
