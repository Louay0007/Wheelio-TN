import { resolvePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getBooking } from "@/server/modules/bookings/application/create-booking";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ bookingId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { bookingId } = await params;
    const principal = await resolvePrincipal(request);
    const booking = await getBooking(principal, bookingId);
    return jsonOk(booking, ctx, { etag: `"v${booking.version}"` });
  } catch (error) {
    return jsonError(error, ctx);
  }
}
