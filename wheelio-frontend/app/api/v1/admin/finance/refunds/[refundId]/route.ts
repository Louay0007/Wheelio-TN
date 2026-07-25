import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getRefund } from "@/server/modules/admin/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ refundId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { refundId } = await params;
    return jsonOk(
      await getRefund(await requirePrincipal(request), refundId),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
