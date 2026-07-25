import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getAgencyReports } from "@/server/modules/agencies/application/longtail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonOk(await getAgencyReports(await requirePrincipal(request)), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
