import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { addPartnerApplicationNote } from "@/server/modules/partners/application/admin-applications";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { id } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const note = await addPartnerApplicationNote(principal, id, body, ctx);
    return jsonCreated(note, ctx, `/api/v1/admin/partner-applications/${id}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
