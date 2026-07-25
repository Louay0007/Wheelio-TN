import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { createPaymentIntent } from "@/server/modules/finance/application/payments";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ bookingId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { bookingId } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json().catch(() => ({}));
    const headerKey = request.headers.get("Idempotency-Key")?.trim();
    const intent = await createPaymentIntent(principal, bookingId, { ...body, idempotencyKey: headerKey || body.idempotencyKey }, ctx);
    return jsonCreated(intent, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
