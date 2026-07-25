import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { replyToReview } from "@/server/modules/agencies/application/longtail";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ reviewId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { reviewId } = await params;
    const data = await replyToReview(
      await requirePrincipal(request),
      reviewId,
      await request.json(),
      ctx,
    );
    return jsonCreated(data, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
