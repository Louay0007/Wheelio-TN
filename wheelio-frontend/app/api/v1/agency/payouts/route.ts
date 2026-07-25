import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { listAgencyPayouts } from "@/server/modules/agencies/application/api-complete";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonOk(
      await listAgencyPayouts(await requirePrincipal(request)),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
