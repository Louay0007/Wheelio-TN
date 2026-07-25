import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getVehicleAdmin } from "@/server/modules/admin/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ vehicleId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { vehicleId } = await params;
    return jsonOk(
      await getVehicleAdmin(await requirePrincipal(request), vehicleId),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
