import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { createSearch } from "@/server/modules/pricing/application/search-quotes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const body = await request.json();
    const result = await createSearch(body);
    return jsonCreated(result, ctx, `/api/v1/search/${result.searchId}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
