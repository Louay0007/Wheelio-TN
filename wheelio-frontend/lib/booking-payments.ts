import {
  bookingTripTotal,
  type BookingRecord,
} from "@/lib/bookings"
import type { PickupMethod } from "@/lib/search-types"

export function paidOnlineTnd(booking: BookingRecord): number {
  if (booking.status === "payment_pending") return 0
  return booking.amountDueNowTnd
}

export function dueAtAgencyTnd(booking: BookingRecord): number {
  return Math.max(0, bookingTripTotal(booking) - paidOnlineTnd(booking))
}

export type PaymentTimelineEvent = {
  id: string
  label: string
  detail: string
  amountTnd?: number
  at: string
  kind: "info" | "debit" | "credit" | "hold"
}

export function demoPaymentTimeline(
  booking: BookingRecord,
): PaymentTimelineEvent[] {
  const trip = bookingTripTotal(booking)
  const paid = paidOnlineTnd(booking)
  const created = booking.createdAt

  const events: PaymentTimelineEvent[] = [
    {
      id: "created",
      label: "Booking total recorded",
      detail: "Rental + extras — separate from refundable deposit at pickup",
      amountTnd: trip,
      at: created,
      kind: "info",
    },
  ]

  if (booking.amountDueNowTnd > 0) {
    if (booking.status === "payment_pending") {
      events.push({
        id: "await-deposit",
        label: "Online deposit not completed",
        detail: "Complete payment to confirm this rate",
        amountTnd: booking.amountDueNowTnd,
        at:
          booking.timeline.find((t) => t.status === "payment_pending")?.at ??
          created,
        kind: "debit",
      })
    } else {
      events.push({
        id: "deposit-captured",
        label: "Online deposit captured",
        detail: "Card ending ··· 4242 (demo)",
        amountTnd: paid,
        at:
          booking.timeline.find((t) => t.status === "payment_pending")?.at ??
          booking.timeline.find((t) => t.status === "confirmed")?.at ??
          created,
        kind: "debit",
      })
    }
  } else {
    events.push({
      id: "pay-desk",
      label: "Pay at agency selected",
      detail: "No online charge — settle rental at the desk",
      at: created,
      kind: "info",
    })
  }

  if (dueAtAgencyTnd(booking) > 0 && booking.status !== "payment_pending") {
    events.push({
      id: "desk-balance",
      label: "Balance due at agency desk",
      detail: "Due before or at vehicle handover",
      amountTnd: dueAtAgencyTnd(booking),
      at: booking.pickupAtIso,
      kind: "debit",
    })
  }

  if (!["cancelled", "requested"].includes(booking.status)) {
    events.push({
      id: "deposit-hold",
      label: "Refundable deposit hold (at pickup)",
      detail: "Not a rental fee — released after return if terms are met",
      amountTnd: booking.depositAtPickupTnd,
      at: booking.pickupAtIso,
      kind: "hold",
    })
  }

  if (booking.status === "completed") {
    events.push({
      id: "deposit-release",
      label: "Deposit release processed",
      detail: "Timing depends on card issuer · typically 5–14 business days",
      amountTnd: booking.depositAtPickupTnd,
      at: booking.returnAtIso,
      kind: "credit",
    })
  }

  if (booking.status === "cancelled" && paid > 0) {
    events.push({
      id: "refund",
      label: "Refund initiated",
      detail: "Per cancellation policy on this rate",
      amountTnd: paid,
      at: booking.timeline.find((t) => t.status === "cancelled")?.at ?? created,
      kind: "credit",
    })
  }

  return events.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  )
}

export function pickupMethodHeading(method: PickupMethod): string {
  switch (method) {
    case "meet_greet":
      return "Meet & greet"
    case "delivery":
      return "Delivery to you"
    case "counter":
    default:
      return "Agency counter"
  }
}
