import { apiFetch, apiFetchCollection } from "@/lib/api/client"
import {
  bookingDetailSchema,
  type BookingDetail,
} from "@/lib/contracts/checkout"

export type BookingListItem = {
  bookingId: string
  reference: string
  status: string
  pickupAt: string
  returnAt: string
  agencyId: string
}

export type CancellationQuote = {
  cancellationQuoteId: string
  bookingId: string
  status: string
  refundEstimate: { amountMillimes: string; currency: "TND" }
  expiresAt: string
}

export function fetchBookings() {
  return apiFetchCollection<BookingListItem>("/api/v1/bookings")
}

export function fetchBookingDetail(bookingId: string) {
  return apiFetch<BookingDetail>(`/api/v1/bookings/${bookingId}`, {
    schema: bookingDetailSchema,
  })
}

export function createCancellationQuote(bookingId: string) {
  return apiFetch<CancellationQuote>(
    `/api/v1/bookings/${bookingId}/cancellation-quotes`,
    { method: "POST" },
  )
}

export function cancelBooking(input: {
  bookingId: string
  cancellationQuoteId: string
  expectedVersion: number
  reason?: string
}) {
  const { bookingId, ...command } = input
  return apiFetch<{ bookingId: string; status: "cancelled"; version: number }>(
    `/api/v1/bookings/${bookingId}/cancellation`,
    { method: "POST", json: command },
  )
}

export function updateBookingSchedule(input: {
  bookingId: string
  expectedVersion: number
  flightNumber?: string
  landingAt?: string
  contactTimingNote?: string
}) {
  const { bookingId, ...command } = input
  return apiFetch<{ bookingId: string; version: number }>(
    `/api/v1/bookings/${bookingId}/schedule`,
    { method: "POST", json: command },
  )
}
