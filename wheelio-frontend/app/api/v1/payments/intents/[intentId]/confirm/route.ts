import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { confirmStubPayment } from "@/server/modules/finance/application/payments";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ intentId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { intentId } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
    if (idempotencyKey) body.idempotencyKey = idempotencyKey;
    return jsonOk(
      await confirmStubPayment(principal, intentId, body, ctx),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
