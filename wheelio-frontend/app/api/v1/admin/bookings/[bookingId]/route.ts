import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getAdminBookingDetail } from "@/server/modules/admin/application/reads";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ bookingId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { bookingId } = await params;
    const principal = await requirePrincipal(request);
    return jsonOk(await getAdminBookingDetail(principal, bookingId), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
