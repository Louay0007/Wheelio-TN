import { createHash, randomBytes } from "node:crypto"
import { and, eq, isNull, sql } from "drizzle-orm"
import { bookingClaimTokens, bookings } from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { conflict, forbidden, validationError } from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { beginIdempotency, completeIdempotency, hashRequestPayload } from "@/server/core/idempotency/service"
import { getLogger } from "@/server/core/observability/logger"
import { enqueueJob, QUEUE_NAMES } from "@/server/core/queue/bullmq"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import { confirmBookingClaimSchema, requestBookingClaimSchema } from "../contracts/claim"

const TOKEN_TTL_MS = 30 * 60_000
export const hashBookingClaimToken = (token: string) => createHash("sha256").update(token).digest("hex")
export const isClaimUsable = (claim: { expiresAt: Date; consumedAt: Date | null; attempts: number; maxAttempts: number }, now = new Date()) =>
  !claim.consumedAt && claim.expiresAt > now && claim.attempts < claim.maxAttempts

export async function requestBookingClaim(input: unknown, ctx: RequestContext) {
  const parsed = requestBookingClaimSchema.parse(input)
  const db = getDb()
  const booking = await db.query.bookings.findFirst({ where: and(eq(bookings.reference, parsed.reference), eq(bookings.guestEmail, parsed.email), isNull(bookings.customerProfileId)) })
  if (!booking) return { accepted: true as const }
  const token = randomBytes(32).toString("base64url")
  const claimId = createId("bct")
  await db.transaction(async (tx) => {
    await tx.insert(bookingClaimTokens).values({ id: claimId, tokenHash: hashBookingClaimToken(token), bookingId: booking.id, email: parsed.email, bookingVersion: booking.version, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) })
    await recordAudit(tx, { action: "booking.claim.requested", resourceType: "booking", resourceId: booking.id, actorClass: "guest", metadata: { claimId } }, ctx)
    await enqueueOutbox(tx, { aggregateType: "booking", aggregateId: booking.id, eventType: "booking.claim.requested", payload: { bookingId: booking.id, claimId }, correlationId: ctx.correlationId })
  })
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  await enqueueJob(QUEUE_NAMES.email, { to: parsed.email, subject: "Claim your Wheelio booking", text: `Sign in with this email, then open: ${baseUrl}/account/claim?token=${encodeURIComponent(token)}\nThis link expires in 30 minutes and can be used once.` }, { jobId: `booking-claim-${claimId}` }).catch((error) => {
    getLogger().error({ err: error, claimId }, "Booking claim email enqueue failed")
  })
  return { accepted: true as const }
}

export async function confirmBookingClaim(input: unknown, principal: EffectivePrincipal, ctx: RequestContext, idempotencyKey: string | null) {
  if (!principal.emailVerified) throw forbidden("EMAIL_VERIFICATION_REQUIRED", "Verify your email before claiming a booking")
  if (!principal.customerProfileId) throw forbidden("FORBIDDEN", "A customer profile is required")
  if (!idempotencyKey) throw validationError("Idempotency-Key header is required")
  const parsed = confirmBookingClaimSchema.parse(input)
  const db = getDb()
  const tokenHash = hashBookingClaimToken(parsed.token)
  const claim = await db.query.bookingClaimTokens.findFirst({ where: eq(bookingClaimTokens.tokenHash, tokenHash) })
  if (!claim || !isClaimUsable(claim)) throw forbidden("FORBIDDEN", "Claim token is invalid or expired")
  if (claim.email !== principal.email.trim().toLowerCase()) {
    await db.update(bookingClaimTokens).set({ attempts: sql`${bookingClaimTokens.attempts} + 1` }).where(and(eq(bookingClaimTokens.id, claim.id), isNull(bookingClaimTokens.consumedAt)))
    throw forbidden("FORBIDDEN", "Claim token does not match this verified account")
  }
  const requestHash = hashRequestPayload({ tokenHash })
  return db.transaction(async (tx) => {
    const idem = await beginIdempotency({ db: tx, principalKey: principal.effectiveUserId, scope: "booking-claim.confirm", key: idempotencyKey, requestHash })
    if (idem.kind === "replay") return idem.responseBody as { bookingId: string; reference: string; version: number; attached: true }
    if (idem.kind === "in_flight") throw conflict("VERSION_CONFLICT", "Claim confirmation is already in progress")
    const [updated] = await tx.update(bookings).set({ customerProfileId: principal.customerProfileId, guestEmail: null, version: sql`${bookings.version} + 1`, updatedAt: new Date() }).where(and(eq(bookings.id, claim.bookingId), eq(bookings.version, claim.bookingVersion), isNull(bookings.customerProfileId))).returning({ id: bookings.id, reference: bookings.reference, version: bookings.version })
    if (!updated) throw conflict("VERSION_CONFLICT", "Booking ownership changed; request a new claim link")
    await tx.update(bookingClaimTokens).set({ consumedAt: new Date(), claimedByUserId: principal.effectiveUserId, requestedAccountUserId: principal.effectiveUserId }).where(and(eq(bookingClaimTokens.id, claim.id), isNull(bookingClaimTokens.consumedAt)))
    const result = { bookingId: updated.id, reference: updated.reference, version: updated.version, attached: true as const }
    await recordAudit(tx, { action: "booking.claim.confirmed", resourceType: "booking", resourceId: updated.id, before: { customerProfileId: null, version: claim.bookingVersion }, after: { customerProfileId: principal.customerProfileId, version: updated.version }, metadata: { claimId: claim.id } }, ctx, principal)
    await enqueueOutbox(tx, { aggregateType: "booking", aggregateId: updated.id, eventType: "booking.claim.confirmed", eventVersion: updated.version, payload: result, correlationId: ctx.correlationId })
    await completeIdempotency({ db: tx, id: idem.id, statusCode: 200, responseBody: result, resourceId: updated.id })
    return result
  })
}
