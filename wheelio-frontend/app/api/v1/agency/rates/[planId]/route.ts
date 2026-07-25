import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getRatePlan } from "@/server/modules/agencies/application/ops-extended";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ planId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { planId } = await params;
    const principal = await requirePrincipal(request);
    return jsonOk(await getRatePlan(principal, planId), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
