import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { analyticsBySlice } from "@/server/modules/admin/application/api-complete";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonOk(
      await analyticsBySlice(await requirePrincipal(request), "demand"),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
