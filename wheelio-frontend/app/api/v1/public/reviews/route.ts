import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";
import { listPublicReviews } from "@/server/modules/fleet/application/public-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const url = new URL(request.url);
    const locale = url.searchParams.get("locale") ?? ctx.locale;
    const agencyId = url.searchParams.get("agencyId") ?? undefined;
    const locationId = url.searchParams.get("locationId") ?? undefined;
    const minRating = url.searchParams.get("minRating");
    const data = await listPublicReviews({
      locale,
      agencyId,
      locationId,
      minRating: minRating ? Number(minRating) : undefined,
    });
    return jsonCollection(data, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
