import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  createBranch,
  listBranches,
} from "@/server/modules/agencies/application/ops-extended";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const rows = await listBranches(principal);
    return jsonCollection(rows, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const branch = await createBranch(principal, body, ctx);
    return jsonCreated(branch, ctx, `/api/v1/agency/branches/${branch.id}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
