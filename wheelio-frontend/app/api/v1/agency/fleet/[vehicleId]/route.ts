import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import {
  getFleetVehicle,
  updateFleetVehicle,
} from "@/server/modules/agencies/application/ops-extended";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ vehicleId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { vehicleId } = await params;
    const principal = await requirePrincipal(request);
    return jsonOk(await getFleetVehicle(principal, vehicleId), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { vehicleId } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    return jsonOk(
      await updateFleetVehicle(principal, vehicleId, body, ctx),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
