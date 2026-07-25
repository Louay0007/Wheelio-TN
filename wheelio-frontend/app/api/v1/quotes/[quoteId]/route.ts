import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getQuote } from "@/server/modules/pricing/application/search-quotes";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ quoteId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { quoteId } = await params;
    const quote = await getQuote(quoteId);
    return jsonOk(quote, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
