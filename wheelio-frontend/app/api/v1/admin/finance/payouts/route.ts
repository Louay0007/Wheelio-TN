import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import { createPayoutBatch } from "@/server/modules/finance/application/payments";
import { listPayoutBatches } from "@/server/modules/admin/application/reads";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    return jsonCollection(
      await listPayoutBatches(principal),
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
    const batch = await createPayoutBatch(principal, body, ctx);
    return jsonCreated(
      batch,
      ctx,
      `/api/v1/admin/finance/payouts/${batch.payoutId}`,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
