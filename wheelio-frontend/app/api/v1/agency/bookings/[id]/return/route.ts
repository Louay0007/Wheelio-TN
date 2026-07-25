import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { completeReturn } from "@/server/modules/agencies/application/ops-extended";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { id } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    return jsonOk(await completeReturn(principal, id, body, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
