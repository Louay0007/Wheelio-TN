import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getStaffMember } from "@/server/modules/admin/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ staffId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { staffId } = await params;
    return jsonOk(
      await getStaffMember(await requirePrincipal(request), staffId),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
