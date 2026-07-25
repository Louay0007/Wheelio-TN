import { apiFetch, apiFetchCollection } from "@/lib/api/client"
import {
  bookingSchema,
  bookingDetailSchema,
  checkoutContextSchema,
  holdSchema,
  paymentIntentSchema,
  quoteSchema,
  searchResultSchema,
  type SearchInput,
} from "@/lib/contracts/checkout"

export type ApiHold = {
  holdId: string
  expiresAt: string
  vehicleId: string | null
}

export type ApiBooking = {
  id: string
  bookingId: string
  reference: string
  status: string
  version: number
  paymentMode: string
  agencyId: string
  deposit: {
    amountMillimes: string
    currency: "TND"
    status: string
  }
  pricing: {
    commissionableMillimes: string
    commissionMillimes: string
    agencyNetMillimes: string
    currency: "TND"
  }
}

export type ApiModificationQuote = {
  modificationQuoteId: string
  bookingId: string
  expiresAt: string
  priceDifference: { amountMillimes: string; currency: "TND" }
  depositDifference: { amountMillimes: string; currency: "TND" }
}

export async function createHold(
  quoteId: string,
  input: {
    expectedQuoteVersion?: number
    vehicleId?: string
    poolId?: string
  },
  idempotencyKey?: string,
) {
  return apiFetch<ApiHold>(`/api/v1/quotes/${quoteId}/holds`, {
    method: "POST",
    json: input,
    schema: holdSchema,
    headers: idempotencyKey
      ? { "Idempotency-Key": idempotencyKey }
      : undefined,
  })
}

export async function createBookingFromQuote(input: {
  quoteId: string
  expectedQuoteVersion?: number
  contactEmail: string
  contactName: string
  driverFullName: string
  driverLicenseCountry: string
  contactPhone?: string
  driverId?: string
  paymentMode?: "deposit_online" | "pay_at_agency"
  locale?: "en" | "fr"
}, idempotencyKey: string) {
  return apiFetch<ApiBooking>("/api/v1/bookings", {
    method: "POST",
    json: input,
    idempotencyKey,
    schema: bookingSchema.transform((booking) => ({
      ...booking,
      id: booking.bookingId,
    })),
  })
}

export async function createSearch(input: SearchInput, signal?: AbortSignal) {
  return apiFetch("/api/v1/search", {
    method: "POST",
    json: input,
    signal,
    schema: searchResultSchema,
  })
}

export async function createQuote(input: {
  searchId: string
  offerId: string
  agencyId: string
  categoryCode: string
  ratePlanId: string
  paymentMode: "deposit_online" | "pay_at_agency"
}) {
  return apiFetch("/api/v1/quotes", {
    method: "POST",
    json: input,
    schema: quoteSchema,
  })
}

export async function fetchBooking(bookingId: string) {
  return apiFetch(`/api/v1/bookings/${bookingId}`, { schema: bookingDetailSchema })
}

export async function fetchCheckoutContext(quoteId: string, signal?: AbortSignal) {
  const quote = await apiFetch(`/api/v1/quotes/${quoteId}`, {
    schema: checkoutContextSchema.shape.quote,
    signal,
  })
  return checkoutContextSchema.parse({ quote, hold: null })
}

export async function releaseHold(quoteId: string) {
  return apiFetch(`/api/v1/quotes/${quoteId}/hold`, { method: "DELETE" })
}

export async function createModificationQuote(
  bookingId: string,
  input: {
    pickupAt?: string
    returnAt?: string
    driverFullName?: string
    extrasMillimes?: string
  },
) {
  return apiFetch<ApiModificationQuote>(
    `/api/v1/bookings/${bookingId}/modification-quotes`,
    { method: "POST", json: input },
  )
}

export async function applyModification(
  bookingId: string,
  input: {
    modificationQuoteId: string
    expectedVersion: number
    proposed: Record<string, unknown>
    priceDifferenceMillimes: string
  },
) {
  return apiFetch<{
    bookingId: string
    modificationRequestId: string
    status: string
    version: number
  }>(`/api/v1/bookings/${bookingId}/modifications`, {
    method: "POST",
    json: input,
  })
}

export async function createPaymentIntent(
  bookingId: string,
  input?: { purpose?: "rental" | "modification"; idempotencyKey?: string },
) {
  return apiFetch(`/api/v1/bookings/${bookingId}/payment-intents`, {
    method: "POST",
    json: input ?? {},
    idempotencyKey: input?.idempotencyKey,
    schema: paymentIntentSchema,
  })
}

export async function confirmPaymentIntent(
  intentId: string,
  clientSecret: string,
  idempotencyKey?: string,
) {
  return apiFetch(`/api/v1/payments/intents/${intentId}/confirm`, {
    method: "POST",
    json: { clientSecret },
    idempotencyKey,
  })
}

export async function fetchMyBookings() {
  return apiFetchCollection<{
    bookingId: string
    reference: string
    status: string
    pickupAt: string
    returnAt: string
    agencyId: string
  }>("/api/v1/bookings")
}
