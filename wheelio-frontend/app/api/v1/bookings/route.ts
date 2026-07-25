import { resolvePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  createBooking,
  listCustomerBookings,
} from "@/server/modules/bookings/application/create-booking";
import { requirePrincipal } from "@/server/core/auth/principal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const rows = await listCustomerBookings(principal);
    return jsonCollection(rows, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await resolvePrincipal(request);
    const body = await request.json();
    const booking = await createBooking(
      principal,
      body,
      ctx,
      request.headers.get("Idempotency-Key"),
    );
    return jsonCreated(booking, ctx, `/api/v1/bookings/${booking.bookingId}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
