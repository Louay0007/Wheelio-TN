import "server-only"

import { headers } from "next/headers"
import type { z } from "zod"
import { apiRequest, type ApiResult } from "@/lib/api/client"

function apiOrigin(requestHeaders: Headers) {
  const configured =
    process.env.WHEELIO_INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, "")

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http"
  if (!host) {
    throw new Error(
      "Set WHEELIO_INTERNAL_API_URL when server-side API fetching has no request host.",
    )
  }
  return `${protocol}://${host}`
}

export async function serverApiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: Omit<RequestInit, "headers"> & { headers?: HeadersInit },
): Promise<ApiResult<T>> {
  const incoming = await headers()
  const forwarded = new Headers(init?.headers)
  const cookie = incoming.get("cookie")
  const locale = incoming.get("accept-language")
  const requestId = incoming.get("x-request-id")

  if (cookie) forwarded.set("cookie", cookie)
  if (locale) forwarded.set("accept-language", locale)
  if (requestId) forwarded.set("x-request-id", requestId)

  return apiRequest(`${apiOrigin(incoming)}${path}`, schema, {
    ...init,
    headers: forwarded,
  })
}
