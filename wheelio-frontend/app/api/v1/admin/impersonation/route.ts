import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { issueImpersonationGrant } from "@/server/modules/admin/application/control-plane";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const grant = await issueImpersonationGrant(principal, body, ctx);
    return jsonCreated(grant, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
