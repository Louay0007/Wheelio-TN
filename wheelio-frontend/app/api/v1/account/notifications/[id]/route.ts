import { requirePrincipal } from "@/server/core/auth/principal"
import { createRequestContext } from "@/server/core/http/request-context"
import { jsonError, jsonOk } from "@/server/core/http/response"
import { setCustomerNotificationRead } from "@/server/modules/customers/application/notifications"

export const dynamic = "force-dynamic"
type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers)
  try {
    const principal = await requirePrincipal(request)
    const { id } = await params
    return jsonOk(await setCustomerNotificationRead(principal, id, await request.json(), ctx), ctx)
  } catch (error) { return jsonError(error, ctx) }
}
