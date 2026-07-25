import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { stopImpersonationGrant } from "@/server/modules/admin/application/control-plane";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ grantId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { grantId } = await params;
    const principal = await requirePrincipal(request);
    return jsonOk(await stopImpersonationGrant(principal, grantId, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
