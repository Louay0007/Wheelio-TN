import { requirePrincipal } from "@/server/core/auth/principal"
import { createRequestContext } from "@/server/core/http/request-context"
import { jsonCollection, jsonError } from "@/server/core/http/response"
import { listCustomerNotifications } from "@/server/modules/customers/application/notifications"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers)
  try {
    const principal = await requirePrincipal(request)
    const result = await listCustomerNotifications(principal, new URL(request.url), request.headers.get("accept-language") ?? ctx.locale)
    return jsonCollection(result.data, result.page, ctx)
  } catch (error) { return jsonError(error, ctx) }
}
