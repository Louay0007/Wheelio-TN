import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { putAgencyPolicy } from "@/server/modules/agencies/application/ops-surface";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ kind: string }> };

export async function PUT(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { kind } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    return jsonOk(await putAgencyPolicy(principal, kind, body, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
