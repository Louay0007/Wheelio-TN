import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  listPromotions,
  upsertPromotion,
} from "@/server/modules/admin/application/longtail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonCollection(
      await listPromotions(await requirePrincipal(request)),
      { nextCursor: null, hasMore: false },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonCreated(
      await upsertPromotion(
        await requirePrincipal(request),
        await request.json(),
        ctx,
      ),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
