import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  createSavedOffer,
  listSavedOffers,
} from "@/server/modules/customers/application/saved-items";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const rows = await listSavedOffers(principal);
    return jsonCollection(rows, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const row = await createSavedOffer(principal, body, ctx);
    return jsonCreated(row, ctx, `/api/v1/account/saved-offers/${row.id}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
