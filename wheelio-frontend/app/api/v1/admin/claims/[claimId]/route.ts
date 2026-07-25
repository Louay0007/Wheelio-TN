import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import {
  getClaim,
  updateClaim,
} from "@/server/modules/admin/application/longtail";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ claimId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { claimId } = await params;
    return jsonOk(
      await getClaim(await requirePrincipal(request), claimId),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { claimId } = await params;
    return jsonOk(
      await updateClaim(
        await requirePrincipal(request),
        claimId,
        await request.json(),
        ctx,
      ),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
