import { requirePrincipal } from "@/server/core/auth/principal"
import { createRequestContext } from "@/server/core/http/request-context"
import { jsonError, jsonOk } from "@/server/core/http/response"
import { getOwnedPayment } from "@/server/modules/finance/application/payment-history"
export const dynamic = "force-dynamic"
type Params = { params: Promise<{ paymentId: string }> }
export async function GET(request: Request, { params }: Params) { const ctx = await createRequestContext(request.headers); try { const principal = await requirePrincipal(request); return jsonOk(await getOwnedPayment(principal, (await params).paymentId), ctx) } catch (error) { return jsonError(error, ctx) } }
