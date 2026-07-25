import { requirePrincipal } from "@/server/core/auth/principal"
import { createRequestContext } from "@/server/core/http/request-context"
import { jsonError, jsonOk } from "@/server/core/http/response"
import { confirmBookingClaim } from "@/server/modules/bookings/application/claim-booking"
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers)
  try { const principal = await requirePrincipal(request); return jsonOk(await confirmBookingClaim(await request.json(), principal, ctx, request.headers.get("Idempotency-Key")), ctx) }
  catch (error) { return jsonError(error, ctx) }
}
