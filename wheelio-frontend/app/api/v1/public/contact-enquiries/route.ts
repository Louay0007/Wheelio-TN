import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { createContactEnquiry } from "@/server/modules/support/application/contact";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const body = await request.json();
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const result = await createContactEnquiry(body, ctx, idempotencyKey);
    return jsonCreated(
      result,
      ctx,
      `/api/v1/public/contact-enquiries/${result.enquiryId}`,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
