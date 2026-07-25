import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";
import { listSessions } from "@/server/modules/identity/application/sessions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const sessions = await listSessions(principal);
    return jsonCollection(sessions, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
