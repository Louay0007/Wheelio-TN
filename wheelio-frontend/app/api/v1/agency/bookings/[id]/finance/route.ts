import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getBookingFinanceAgency } from "@/server/modules/agencies/application/api-complete";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { id } = await params;
    return jsonOk(
      await getBookingFinanceAgency(await requirePrincipal(request), id),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
