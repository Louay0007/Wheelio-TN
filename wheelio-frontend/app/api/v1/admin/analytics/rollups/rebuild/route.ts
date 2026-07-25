import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { rebuildAnalyticsRollups } from "@/server/modules/admin/application/control-plane";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    return jsonOk(await rebuildAnalyticsRollups(principal, body, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
