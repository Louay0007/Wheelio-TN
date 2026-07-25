import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { revokeOtherSessions } from "@/server/modules/identity/application/sessions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const result = await revokeOtherSessions(principal, ctx);
    return jsonOk(result, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
