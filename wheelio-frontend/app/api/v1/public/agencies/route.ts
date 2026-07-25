import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";
import { listPublicAgencies } from "@/server/modules/fleet/application/public-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const url = new URL(request.url);
    const locale = url.searchParams.get("locale") ?? ctx.locale;
    const city = url.searchParams.get("city") ?? undefined;
    const minRating = url.searchParams.get("minRating");
    const data = await listPublicAgencies({
      locale,
      city,
      minRating: minRating ? Number(minRating) : undefined,
    });
    return jsonCollection(data, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
