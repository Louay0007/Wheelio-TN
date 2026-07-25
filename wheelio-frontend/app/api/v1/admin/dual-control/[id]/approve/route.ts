import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { approveDualControlRequest } from "@/server/modules/admin/application/dual-control";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { id } = await params;
    const principal = await requirePrincipal(request);
    const result = await approveDualControlRequest(principal, id, ctx);
    return jsonOk(result, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
