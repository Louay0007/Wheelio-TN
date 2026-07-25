import { resolvePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { createCancellationQuote } from "@/server/modules/bookings/application/lifecycle";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ bookingId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { bookingId } = await params;
    const principal = await resolvePrincipal(request);
    const quote = await createCancellationQuote(principal, bookingId);
    return jsonOk(quote, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
