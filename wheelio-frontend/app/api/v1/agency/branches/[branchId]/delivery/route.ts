import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError, jsonOk } from "@/server/core/http/response";
import {
  listBranchDelivery,
  upsertBranchDelivery,
} from "@/server/modules/agencies/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ branchId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { branchId } = await params;
    return jsonOk(
      await listBranchDelivery(await requirePrincipal(request), branchId),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { branchId } = await params;
    return jsonCreated(
      await upsertBranchDelivery(
        await requirePrincipal(request),
        branchId,
        await request.json(),
        ctx,
      ),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
