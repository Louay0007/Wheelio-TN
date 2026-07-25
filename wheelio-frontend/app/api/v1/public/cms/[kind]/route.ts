import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";
import { listPublishedContent } from "@/server/modules/reviews-content/application/get-published-content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ kind: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { kind } = await params;
    const url = new URL(request.url);
    const locale = url.searchParams.get("locale") ?? ctx.locale;
    const data = await listPublishedContent({ kind, locale });
    return jsonCollection(data, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
