import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { overrideBooking } from "@/server/modules/admin/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ bookingId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { bookingId } = await params;
    return jsonOk(
      await overrideBooking(
        await requirePrincipal(request),
        bookingId,
        await request.json(),
        ctx,
      ),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
