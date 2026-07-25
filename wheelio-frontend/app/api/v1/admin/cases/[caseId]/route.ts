import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import {
  getSupportCase,
  updateSupportCase,
} from "@/server/modules/admin/application/reads";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ caseId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { caseId } = await params;
    const principal = await requirePrincipal(request);
    return jsonOk(await getSupportCase(principal, caseId), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { caseId } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    return jsonOk(await updateSupportCase(principal, caseId, body, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
