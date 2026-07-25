import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";
import { getAdminAgencyRates } from "@/server/modules/admin/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ agencyId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { agencyId } = await params;
    const data = await getAdminAgencyRates(
      await requirePrincipal(request),
      agencyId,
    );
    return jsonCollection(
      Array.isArray(data) ? data : [data],
      { nextCursor: null, hasMore: false },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
