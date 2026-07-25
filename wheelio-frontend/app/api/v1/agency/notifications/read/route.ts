import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { markAgencyNotificationsRead } from "@/server/modules/agencies/application/ops-surface";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    return jsonOk(await markAgencyNotificationsRead(principal, body, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
