import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { updateTeamMember } from "@/server/modules/agencies/application/longtail";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ memberId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { memberId } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    return jsonOk(await updateTeamMember(principal, memberId, body, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
