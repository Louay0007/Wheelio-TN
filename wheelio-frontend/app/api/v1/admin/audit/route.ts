import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";
import { listAuditEvents } from "@/server/modules/admin/application/longtail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    return jsonCollection(
      await listAuditEvents(await requirePrincipal(request), { limit }),
      { nextCursor: null, hasMore: false },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
