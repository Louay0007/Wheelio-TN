import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";
import { listAdminAgencies } from "@/server/modules/admin/application/longtail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonCollection(
      await listAdminAgencies(await requirePrincipal(request)),
      { nextCursor: null, hasMore: false },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
