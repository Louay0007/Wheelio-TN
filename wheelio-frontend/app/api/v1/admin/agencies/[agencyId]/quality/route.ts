import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getAdminAgencyQuality } from "@/server/modules/admin/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ agencyId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { agencyId } = await params;
    return jsonOk(
      await getAdminAgencyQuality(await requirePrincipal(request), agencyId),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
