import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getPublishedCategory } from "@/server/modules/fleet/application/public-catalog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { code } = await params;
    const url = new URL(request.url);
    const locale = url.searchParams.get("locale") ?? ctx.locale;
    const data = await getPublishedCategory(code, locale);
    return jsonOk(data, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
