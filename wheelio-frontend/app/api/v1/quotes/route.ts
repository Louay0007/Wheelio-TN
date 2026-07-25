import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { createQuote } from "@/server/modules/pricing/application/search-quotes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const body = await request.json();
    const quote = await createQuote(body);
    return jsonCreated(quote, ctx, `/api/v1/quotes/${quote.quoteId}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
