import { resolvePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { releaseInventoryHold } from "@/server/modules/availability/application/holds";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ quoteId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { quoteId } = await params;
    const principal = await resolvePrincipal(request);
    const result = await releaseInventoryHold(quoteId, ctx, principal);
    return jsonOk(result, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
