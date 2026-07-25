import { requirePrincipal } from "@/server/core/auth/principal"
import { createRequestContext } from "@/server/core/http/request-context"
import { jsonError } from "@/server/core/http/response"
import { downloadOwnedReceipt } from "@/server/modules/finance/application/payment-history"
export const dynamic = "force-dynamic"
type Params = { params: Promise<{ paymentId: string }> }
export async function GET(request: Request, { params }: Params) { const ctx = await createRequestContext(request.headers); try { const principal = await requirePrincipal(request); const receipt = await downloadOwnedReceipt(principal, (await params).paymentId); return new Response(receipt.stream as unknown as BodyInit, { headers: { "Content-Type": receipt.contentType, "Content-Disposition": `attachment; filename="${receipt.filename}"`, "X-Request-Id": ctx.requestId } }) } catch (error) { return jsonError(error, ctx) } }
