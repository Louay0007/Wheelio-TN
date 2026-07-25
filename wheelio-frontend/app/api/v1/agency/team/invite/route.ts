import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { inviteTeamMember } from "@/server/modules/agencies/application/longtail";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const data = await inviteTeamMember(principal, body, ctx);
    return jsonCreated(data, ctx, `/api/v1/agency/team`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
