import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getPublicBootstrap } from "@/server/modules/fleet/application/public-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const url = new URL(request.url);
    const locale = url.searchParams.get("locale") ?? ctx.locale;
    const data = await getPublicBootstrap(locale);
    return jsonOk(data, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
