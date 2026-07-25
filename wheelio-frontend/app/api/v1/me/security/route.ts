import { requirePrincipal } from "@/server/core/auth/principal"
import { createRequestContext } from "@/server/core/http/request-context"
import { jsonError, jsonOk } from "@/server/core/http/response"
import { getSecurityOverview } from "@/server/modules/identity/application/security"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers)
  try {
    const principal = await requirePrincipal(request)
    return jsonOk(await getSecurityOverview(principal), ctx)
  } catch (error) {
    return jsonError(error, ctx)
  }
}
