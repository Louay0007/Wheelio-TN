import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";
import { listAdminCustomers } from "@/server/modules/admin/application/reads";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const rows = await listAdminCustomers(principal);
    return jsonCollection(rows, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
