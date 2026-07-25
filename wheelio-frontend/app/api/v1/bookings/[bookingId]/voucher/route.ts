import { resolvePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getBooking } from "@/server/modules/bookings/application/create-booking";
import { getBookingVoucher } from "@/server/modules/bookings/application/lifecycle";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ bookingId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { bookingId } = await params;
    const principal = await resolvePrincipal(request);
    await getBooking(principal, bookingId);
    return jsonOk(getBookingVoucher(bookingId), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
