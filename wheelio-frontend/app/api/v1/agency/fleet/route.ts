import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  createFleetVehicle,
  listFleet,
} from "@/server/modules/agencies/application/ops-extended";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    return jsonCollection(
      await listFleet(principal),
      { nextCursor: null, hasMore: false },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const vehicle = await createFleetVehicle(principal, body, ctx);
    return jsonCreated(vehicle, ctx, `/api/v1/agency/fleet/${vehicle.id}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
