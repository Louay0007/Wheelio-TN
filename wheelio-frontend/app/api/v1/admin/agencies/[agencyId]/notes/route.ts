import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { addAdminAgencyNote } from "@/server/modules/admin/application/longtail";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ agencyId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { agencyId } = await params;
    return jsonCreated(
      await addAdminAgencyNote(
        await requirePrincipal(request),
        agencyId,
        await request.json(),
        ctx,
      ),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
