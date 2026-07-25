import { requirePrincipal } from "@/server/core/auth/principal"
import { createRequestContext } from "@/server/core/http/request-context"
import { jsonError, jsonOk } from "@/server/core/http/response"
import { listPrivacyRequests } from "@/server/modules/customers/application/privacy"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { const ctx = await createRequestContext(request.headers); try { return jsonOk(await listPrivacyRequests(await requirePrincipal(request)), ctx) } catch (error) { return jsonError(error, ctx) } }
