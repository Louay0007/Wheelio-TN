import { headers } from "next/headers"
import { createCorrelationId, createRequestId } from "@/server/contracts/ids"
import { localeSchema, type AppLocale } from "@/server/contracts/pagination"

export type RequestContext = {
  requestId: string
  correlationId: string
  locale: AppLocale
  ipAddress: string | null
  userAgent: string | null
}

export async function createRequestContext(
  incoming?: Headers,
): Promise<RequestContext> {
  const h = incoming ?? (await headers())
  const requestId =
    sanitizeId(h.get("x-request-id")) ?? createRequestId()
  const correlationId =
    sanitizeId(h.get("x-correlation-id")) ?? createCorrelationId()
  const locale = resolveLocale(h.get("accept-language"))
  return {
    requestId,
    correlationId,
    locale,
    ipAddress: firstIp(h.get("x-forwarded-for")) ?? h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  }
}

function sanitizeId(value: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!/^[A-Za-z0-9._:-]{8,64}$/.test(trimmed)) return null
  return trimmed
}

function resolveLocale(header: string | null): AppLocale {
  if (!header) return "en"
  const primary = header.split(",")[0]?.trim().toLowerCase() ?? "en"
  const base = primary.slice(0, 2)
  const parsed = localeSchema.safeParse(base)
  return parsed.success ? parsed.data : "en"
}

function firstIp(forwarded: string | null) {
  if (!forwarded) return null
  return forwarded.split(",")[0]?.trim() || null
}
