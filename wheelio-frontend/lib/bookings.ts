import { getOfferDetail } from "@/lib/offer-detail"
import type { ConfirmationType } from "@/lib/search-types"

export type BookingStatus =
  | "requested"
  | "held"
  | "payment_pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled"

export type PaymentMode = "deposit_online" | "pay_at_agency"

export type BookingExtraId =
  | "child_seat"
  | "additional_driver"
  | "gps"
  | "prepaid_fuel"

export type BookingExtra = {
  id: BookingExtraId
  label: string
  description: string
  priceTnd: number
}

export const CHECKOUT_EXTRAS: BookingExtra[] = [
  {
    id: "child_seat",
    label: "Child seat",
    description: "Suitable for toddlers · subject to agency stock",
    priceTnd: 45,
  },
  {
    id: "additional_driver",
    label: "Additional driver",
    description: "Second licensed driver on the contract",
    priceTnd: 60,
  },
  {
    id: "gps",
    label: "GPS unit",
    description: "Offline maps useful outside city centres",
    priceTnd: 35,
  },
  {
    id: "prepaid_fuel",
    label: "Prepaid full tank",
    description: "Skip the return fuel stop · full-to-full still applies if unused",
    priceTnd: 120,
  },
]

export type BookingRecord = {
  id: string
  reference: string
  offerId: string
  status: BookingStatus
  confirmation: ConfirmationType
  paymentMode: PaymentMode
  contactName: string
  contactEmail: string
  contactPhone: string
  driverName: string
  driverAgeBand: string
  licenseCountry: string
  flightNumber?: string
  landingTime?: string
  extras: BookingExtraId[]
  rentalTotalTnd: number
  extrasTotalTnd: number
  amountDueNowTnd: number
  depositAtPickupTnd: number
  createdAt: string
  agencyDeadlineHours?: number
  timeline: { status: BookingStatus; label: string; at: string }[]
}

function makeReference(seed: string) {
  const stamp = seed.replace(/\D/g, "").slice(-6) || "240001"
  return `WTN-${stamp}`
}

/** Demo booking used when deep-linking without a live checkout submit. */
export function getDemoBooking(bookingId: string): BookingRecord | null {
  const offerId =
    bookingId.startsWith("tn-") || bookingId.includes("eco") || bookingId.includes("cmp")
      ? bookingId.replace(/^bk-/, "")
      : "tn-cmp-208-02"

  const offer = getOfferDetail(offerId) ?? getOfferDetail("tn-cmp-208-02")
  if (!offer) return null

  const id = bookingId.startsWith("bk-") ? bookingId : `bk-${offer.id}`
  const isRequest = offer.confirmation === "request"
  const status: BookingStatus = isRequest ? "requested" : "confirmed"
  const extrasTotal = 45
  const rentalTotal = offer.totalPriceTnd
  const amountDueNow =
    offer.confirmation === "instant" ? Math.round(rentalTotal * 0.2) : 0

  const now = new Date()
  const iso = (offsetHours: number) => {
    const d = new Date(now)
    d.setHours(d.getHours() - offsetHours)
    return d.toISOString()
  }

  return {
    id,
    reference: makeReference(offer.id),
    offerId: offer.id,
    status,
    confirmation: offer.confirmation,
    paymentMode: amountDueNow > 0 ? "deposit_online" : "pay_at_agency",
    contactName: "Amine Ben Youssef",
    contactEmail: "amine@example.com",
    contactPhone: "+216 20 000 000",
    driverName: "Amine Ben Youssef",
    driverAgeBand: "30",
    licenseCountry: "TN",
    flightNumber: "TU614",
    landingTime: "10:40",
    extras: ["child_seat"],
    rentalTotalTnd: rentalTotal,
    extrasTotalTnd: extrasTotal,
    amountDueNowTnd: amountDueNow,
    depositAtPickupTnd: offer.depositTnd,
    createdAt: iso(1),
    agencyDeadlineHours: isRequest ? 6 : undefined,
    timeline: isRequest
      ? [
          { status: "requested", label: "Request sent to agency", at: iso(1) },
          { status: "held", label: "Price held while agency reviews", at: iso(1) },
        ]
      : [
          { status: "requested", label: "Booking started", at: iso(2) },
          { status: "held", label: "Offer held", at: iso(2) },
          {
            status: "payment_pending",
            label: amountDueNow > 0 ? "Online deposit recorded" : "Pay at agency selected",
            at: iso(1),
          },
          { status: "confirmed", label: "Confirmed by agency", at: iso(0.5) },
        ],
  }
}

export function createBookingId(offerId: string) {
  return `bk-${offerId}`
}

export function statusLabel(status: BookingStatus): string {
  switch (status) {
    case "requested":
      return "Waiting for agency"
    case "held":
      return "Price held"
    case "payment_pending":
      return "Payment pending"
    case "confirmed":
      return "Confirmed"
    case "active":
      return "Active rental"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
  }
}

export function estimateRefund(
  booking: BookingRecord,
  policy: "free" | "partial" | "non_refundable",
): number {
  const paid = booking.amountDueNowTnd
  if (policy === "free") return paid
  if (policy === "partial") return Math.round(paid * 0.5)
  return 0
}
