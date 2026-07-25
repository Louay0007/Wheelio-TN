import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getAgencyPayout } from "@/server/modules/agencies/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ payoutId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { payoutId } = await params;
    return jsonOk(
      await getAgencyPayout(await requirePrincipal(request), payoutId),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
