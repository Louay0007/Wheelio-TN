import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError, jsonOk } from "@/server/core/http/response";
import {
  listAgencyFees,
  putAgencyFees,
} from "@/server/modules/agencies/application/ops-surface";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    return jsonCollection(
      await listAgencyFees(principal),
      { nextCursor: null, hasMore: false },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PUT(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    return jsonOk(await putAgencyFees(principal, body, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
