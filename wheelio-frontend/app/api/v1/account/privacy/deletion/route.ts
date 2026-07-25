import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { requestPrivacyDeletion } from "@/server/modules/customers/application/privacy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const result = await requestPrivacyDeletion(principal, body, ctx, request.headers.get("Idempotency-Key"));
    return jsonOk(result, ctx, { status: 202 });
  } catch (error) {
    return jsonError(error, ctx);
  }
}
