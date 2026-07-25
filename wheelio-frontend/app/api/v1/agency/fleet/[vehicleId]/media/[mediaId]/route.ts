import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { deleteVehicleMedia } from "@/server/modules/agencies/application/ops-surface";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ vehicleId: string; mediaId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { vehicleId, mediaId } = await params;
    const principal = await requirePrincipal(request);
    return jsonOk(
      await deleteVehicleMedia(principal, vehicleId, mediaId, ctx),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
