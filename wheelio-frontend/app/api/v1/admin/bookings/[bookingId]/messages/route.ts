import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  listBookingMessages,
  postBookingMessage,
} from "@/server/modules/agencies/application/ops-surface";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ bookingId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { bookingId } = await params;
    const principal = await requirePrincipal(request);
    return jsonCollection(
      await listBookingMessages(principal, bookingId),
      { nextCursor: null, hasMore: false },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { bookingId } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const msg = await postBookingMessage(principal, bookingId, body, ctx);
    return jsonCreated(
      msg,
      ctx,
      `/api/v1/admin/bookings/${bookingId}/messages/${msg.id}`,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
