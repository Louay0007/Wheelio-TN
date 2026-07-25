import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getAgencyDashboard } from "@/server/modules/agencies/application/operations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const data = await getAgencyDashboard(principal);
    return jsonOk(data, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
