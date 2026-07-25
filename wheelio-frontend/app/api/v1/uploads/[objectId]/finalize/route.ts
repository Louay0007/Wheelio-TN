import { resolvePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { finalizeUpload } from "@/server/modules/documents/application/upload-intent";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ objectId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { objectId } = await params;
    const principal = await resolvePrincipal(request);
    const body = await request.json().catch(() => ({}));
    return jsonOk(await finalizeUpload(principal, objectId, body), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
