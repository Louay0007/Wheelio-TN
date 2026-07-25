import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { deleteAvailabilityBlock } from "@/server/modules/agencies/application/ops-surface";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ blockId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { blockId } = await params;
    const principal = await requirePrincipal(request);
    return jsonOk(await deleteAvailabilityBlock(principal, blockId, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
