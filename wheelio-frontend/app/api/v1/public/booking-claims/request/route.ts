import { createRequestContext } from "@/server/core/http/request-context"
import { jsonError, jsonOk } from "@/server/core/http/response"
import { requestBookingClaim } from "@/server/modules/bookings/application/claim-booking"
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers)
  try { return jsonOk(await requestBookingClaim(await request.json(), ctx), ctx, { status: 202 }) }
  catch (error) { return jsonError(error, ctx) }
}
