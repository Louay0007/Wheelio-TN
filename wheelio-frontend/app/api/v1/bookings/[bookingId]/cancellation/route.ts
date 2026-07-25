import { resolvePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { cancelBooking } from "@/server/modules/bookings/application/lifecycle";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ bookingId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { bookingId } = await params;
    const principal = await resolvePrincipal(request);
    const body = await request.json();
    const result = await cancelBooking(principal, bookingId, body, ctx);
    return jsonOk(result, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
