import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { closeReconciliationRun } from "@/server/modules/admin/application/longtail";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ runId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { runId } = await params;
    return jsonOk(
      await closeReconciliationRun(
        await requirePrincipal(request),
        runId,
        await request.json(),
        ctx,
      ),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
