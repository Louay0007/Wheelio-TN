import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { acceptAgencyInvite } from "@/server/modules/agencies/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { token } = await params;
    return jsonOk(
      await acceptAgencyInvite(await requirePrincipal(request), token, ctx),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
