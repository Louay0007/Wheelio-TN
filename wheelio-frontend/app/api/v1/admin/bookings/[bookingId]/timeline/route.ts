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
    const detail = await getAdminBookingDetail(principal, bookingId);
    return jsonOk(
      {
        bookingId: detail.bookingId,
        reference: detail.reference,
        status: detail.status,
        timeline: detail.timeline ?? [],
        linkedCases: detail.linkedCases ?? [],
      },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
