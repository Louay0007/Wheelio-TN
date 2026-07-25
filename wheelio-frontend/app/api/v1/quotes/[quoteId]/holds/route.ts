import { resolvePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { createInventoryHold } from "@/server/modules/availability/application/holds";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ quoteId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { quoteId } = await params;
    const principal = await resolvePrincipal(request);
    const body = await request.json().catch(() => ({}));
    const hold = await createInventoryHold(quoteId, body, ctx, {
      principal,
      idempotencyKey: request.headers.get("Idempotency-Key"),
    });
    return jsonCreated(
      hold,
      ctx,
      `/api/v1/quotes/${quoteId}/holds/${hold.holdId}`,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
