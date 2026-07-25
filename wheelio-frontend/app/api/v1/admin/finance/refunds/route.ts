import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  createRefundRequest,
  listRefunds,
} from "@/server/modules/admin/application/reads";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    return jsonCollection(
      await listRefunds(principal),
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
    const refund = await createRefundRequest(principal, body, ctx);
    return jsonCreated(
      refund,
      ctx,
      `/api/v1/admin/finance/refunds/${refund.id}`,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
