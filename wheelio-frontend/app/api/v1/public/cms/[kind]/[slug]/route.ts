import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getPublishedContent } from "@/server/modules/reviews-content/application/get-published-content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ kind: string; slug: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { kind, slug } = await params;
    const url = new URL(request.url);
    const locale = url.searchParams.get("locale") ?? ctx.locale;
    const data = await getPublishedContent({ kind, slug, locale });
    return jsonOk(data, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
