import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  createAvailabilityBlock,
  listAvailabilityBlocks,
} from "@/server/modules/agencies/application/ops-surface";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const vehicleId =
      new URL(request.url).searchParams.get("vehicleId") ?? undefined;
    return jsonCollection(
      await listAvailabilityBlocks(principal, { vehicleId }),
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
    const block = await createAvailabilityBlock(principal, body, ctx);
    return jsonCreated(
      block,
      ctx,
      `/api/v1/agency/availability-blocks/${block.id}`,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
