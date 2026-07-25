import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getPartnerContent } from "@/server/modules/support/application/contact";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const url = new URL(request.url);
    const locale = url.searchParams.get("locale") ?? ctx.locale;
    const data = getPartnerContent(locale);
    return jsonOk(data, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
