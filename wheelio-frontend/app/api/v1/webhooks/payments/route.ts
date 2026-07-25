import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { handlePaymentWebhook } from "@/server/modules/finance/application/payments";
import { verifyWebhookSignature } from "@/server/modules/finance/application/webhook-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const rawBody = await request.text();
    verifyWebhookSignature(
      rawBody,
      request.headers.get("x-wheelio-webhook-signature"),
    );
    const body = JSON.parse(rawBody) as unknown;
    return jsonOk(await handlePaymentWebhook(body, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
