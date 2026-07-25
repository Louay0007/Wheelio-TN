import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { createDualControlRequest } from "@/server/modules/admin/application/dual-control";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const result = await createDualControlRequest(principal, body, ctx);
    return jsonCreated(result, ctx, `/api/v1/admin/dual-control/${result.id}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
