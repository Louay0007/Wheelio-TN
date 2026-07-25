import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { revokeSession } from "@/server/modules/identity/application/sessions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sessionId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { sessionId } = await params;
    const principal = await requirePrincipal(request);
    const result = await revokeSession(principal, sessionId, ctx);
    return jsonOk(result, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
