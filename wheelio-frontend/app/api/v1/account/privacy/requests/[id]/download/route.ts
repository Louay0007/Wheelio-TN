import { requirePrincipal } from "@/server/core/auth/principal"
import { createRequestContext } from "@/server/core/http/request-context"
import { jsonError, jsonOk } from "@/server/core/http/response"
import { getPrivacyArtifactDownload } from "@/server/modules/customers/application/privacy"
export const dynamic = "force-dynamic"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const ctx = await createRequestContext(request.headers); try { const { id } = await params; return jsonOk(await getPrivacyArtifactDownload(await requirePrincipal(request), id), ctx) } catch (error) { return jsonError(error, ctx) } }
