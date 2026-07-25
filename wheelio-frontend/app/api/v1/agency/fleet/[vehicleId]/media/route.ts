import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  attachVehicleMedia,
  listVehicleMedia,
} from "@/server/modules/agencies/application/ops-surface";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ vehicleId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { vehicleId } = await params;
    const principal = await requirePrincipal(request);
    return jsonCollection(
      await listVehicleMedia(principal, vehicleId),
      { nextCursor: null, hasMore: false },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { vehicleId } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const media = await attachVehicleMedia(principal, vehicleId, body, ctx);
    return jsonCreated(
      media,
      ctx,
      `/api/v1/agency/fleet/${vehicleId}/media/${media.id}`,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
