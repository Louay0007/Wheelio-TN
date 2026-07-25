import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getPromotion } from "@/server/modules/admin/application/api-complete";
import { upsertPromotion } from "@/server/modules/admin/application/longtail";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ promoId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { promoId } = await params;
    return jsonOk(
      await getPromotion(await requirePrincipal(request), promoId),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { promoId } = await params;
    const body = await request.json();
    return jsonOk(
      await upsertPromotion(
        await requirePrincipal(request),
        { ...body, id: promoId },
        ctx,
      ),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
