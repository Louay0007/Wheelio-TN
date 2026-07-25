import { getOfferDetail } from "@/lib/offer-detail"
import type { ConfirmationType } from "@/lib/search-types"
import {
  addDaysToTunisWall,
  formatTunisDateTime,
} from "@/lib/trip-datetime"

export type BookingStatus =
  | "requested"
  | "held"
  | "payment_pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled"

export type PaymentMode = "deposit_online" | "pay_at_agency"

export type TripFilter = "upcoming" | "active" | "past" | "cancelled" | "all"

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
  pickupLocation: string
  dropoffLocation: string
  pickupAtIso: string
  returnAtIso: string
  pickupLabel: string
  returnLabel: string
}

function makeReference(seed: string) {
  const stamp = seed.replace(/\D/g, "").slice(-6) || "240001"
  return `WTN-${stamp}`
}

function iso(offsetHours: number, base = new Date()) {
  const d = new Date(base)
  d.setHours(d.getHours() - offsetHours)
  return d.toISOString()
}

type TripWindow = {
  pickupAtIso: string
  returnAtIso: string
  pickupLabel: string
  returnLabel: string
}

function tripWindowForStatus(
  status: BookingStatus,
  rentalDays: number,
  now = new Date(),
): TripWindow {
  let pickupOffset: number
  switch (status) {
    case "completed":
    case "cancelled":
      pickupOffset = -14
      break
    case "active":
      pickupOffset = -1
      break
    case "payment_pending":
    case "confirmed":
    case "requested":
    case "held":
    default:
      pickupOffset = 4
      break
  }

  const pickupAtIso = addDaysToTunisWall(now, pickupOffset, 10, 30)
  const returnAtIso = addDaysToTunisWall(
    now,
    pickupOffset + Math.max(1, rentalDays),
    10,
    0,
  )

  return {
    pickupAtIso,
    returnAtIso,
    pickupLabel: formatTunisDateTime(pickupAtIso),
    returnLabel: formatTunisDateTime(returnAtIso),
  }
}

function defaultLocations(offerId: string) {
  const offer = getOfferDetail(offerId)
  const label =
    offer?.pickupAddress ??
    offer?.agency.locationLabel ??
    "Tunis-Carthage Airport (TUN)"
  return { pickupLocation: label, dropoffLocation: label }
}

type BuildBookingInput = {
  id: string
  offerId: string
  status: BookingStatus
  confirmation?: ConfirmationType
  contactEmail?: string
  extras?: BookingExtraId[]
  rentalDays?: number
}

function buildDemoBooking(input: BuildBookingInput): BookingRecord | null {
  const offer = getOfferDetail(input.offerId)
  if (!offer) return null

  const confirmation = input.confirmation ?? offer.confirmation
  const extras = input.extras ?? []
  const extrasTotal = extras.includes("child_seat") ? 45 : extras.includes("gps") ? 35 : 0
  const rentalTotal = offer.totalPriceTnd
  const amountDueNow =
    input.status === "payment_pending"
      ? Math.round(rentalTotal * 0.2)
      : confirmation === "instant" && ["confirmed", "active"].includes(input.status)
        ? Math.round(rentalTotal * 0.2)
        : 0

  const days = input.rentalDays ?? 5
  const trip = tripWindowForStatus(input.status, days)
  const { pickupLocation, dropoffLocation } = defaultLocations(input.offerId)

  const isRequest = confirmation === "request"
  const timeline: BookingRecord["timeline"] =
    input.status === "cancelled"
      ? [
          { status: "requested", label: "Request sent", at: iso(72) },
          { status: "held", label: "Offer held", at: iso(70) },
          { status: "confirmed", label: "Confirmed by agency", at: iso(48) },
          {
            status: "cancelled",
            label: "Cancelled by customer",
            at: iso(24),
          },
        ]
      : input.status === "completed"
        ? [
            { status: "requested", label: "Booking started", at: iso(360) },
            { status: "held", label: "Offer held", at: iso(358) },
            {
              status: "payment_pending",
              label: "Deposit recorded",
              at: iso(350),
            },
            { status: "confirmed", label: "Confirmed", at: iso(340) },
            { status: "active", label: "Vehicle collected", at: iso(336) },
            { status: "completed", label: "Returned on time", at: iso(320) },
          ]
        : input.status === "active"
          ? [
              { status: "requested", label: "Booking started", at: iso(120) },
              { status: "confirmed", label: "Confirmed", at: iso(100) },
              { status: "active", label: "Vehicle collected", at: iso(26) },
            ]
          : input.status === "payment_pending"
            ? [
                { status: "requested", label: "Booking started", at: iso(4) },
                { status: "held", label: "Offer held", at: iso(3.5) },
                {
                  status: "payment_pending",
                  label: "Awaiting online deposit",
                  at: iso(2),
                },
              ]
            : isRequest || input.status === "requested"
              ? [
                  {
                    status: "requested",
                    label: "Request sent to agency",
                    at: iso(5),
                  },
                  {
                    status: "held",
                    label: "Price held while agency reviews",
                    at: iso(5),
                  },
                ]
              : [
                  { status: "requested", label: "Booking started", at: iso(48) },
                  { status: "held", label: "Offer held", at: iso(47) },
                  {
                    status: "payment_pending",
                    label:
                      amountDueNow > 0
                        ? "Online deposit recorded"
                        : "Pay at agency selected",
                    at: iso(46),
                  },
                  {
                    status: "confirmed",
                    label: "Confirmed by agency",
                    at: iso(40),
                  },
                ]

  return {
    id: input.id,
    reference: makeReference(input.offerId),
    offerId: offer.id,
    status: input.status,
    confirmation,
    paymentMode: amountDueNow > 0 ? "deposit_online" : "pay_at_agency",
    contactName: "Amine Ben Youssef",
    contactEmail: input.contactEmail ?? "amine@example.com",
    contactPhone: "+216 20 000 000",
    driverName: "Amine Ben Youssef",
    driverAgeBand: "30",
    licenseCountry: "TN",
    flightNumber: pickupLocation.toLowerCase().includes("airport")
      ? "TU614"
      : undefined,
    landingTime: pickupLocation.toLowerCase().includes("airport")
      ? "10:40"
      : undefined,
    extras,
    rentalTotalTnd: rentalTotal,
    extrasTotalTnd: extrasTotal,
    amountDueNowTnd: amountDueNow,
    depositAtPickupTnd: offer.depositTnd,
    createdAt: iso(6),
    agencyDeadlineHours: isRequest ? 6 : undefined,
    timeline,
    pickupLocation,
    dropoffLocation,
    ...trip,
  }
}

const DEMO_TRIP_SPECS: BuildBookingInput[] = [
  {
    id: "bk-tn-cmp-208-02",
    offerId: "tn-cmp-208-02",
    status: "confirmed",
    extras: ["child_seat"],
  },
  {
    id: "bk-tn-eco-clio-01",
    offerId: "tn-eco-clio-01",
    status: "requested",
    confirmation: "request",
  },
  {
    id: "bk-tn-int-corolla-03",
    offerId: "tn-int-corolla-03",
    status: "active",
    rentalDays: 7,
  },
  {
    id: "bk-tn-suv-tucson-04",
    offerId: "tn-suv-tucson-04",
    status: "completed",
    rentalDays: 6,
  },
  {
    id: "bk-tn-eco-i10-07",
    offerId: "tn-eco-i10-07",
    status: "cancelled",
  },
  {
    id: "bk-tn-cmp-golf-08",
    offerId: "tn-cmp-golf-08",
    status: "payment_pending",
    extras: ["gps"],
  },
]

let demoTripsCache: BookingRecord[] | null = null

export function listDemoTrips(): BookingRecord[] {
  if (demoTripsCache) return demoTripsCache
  demoTripsCache = DEMO_TRIP_SPECS.map((spec) => buildDemoBooking(spec)).filter(
    (b): b is BookingRecord => b !== null,
  )
  return demoTripsCache
}

/** Demo booking used when deep-linking without a live checkout submit. */
export function getDemoBooking(bookingId: string): BookingRecord | null {
  const fromList = listDemoTrips().find((b) => b.id === bookingId)
  if (fromList) return { ...fromList }

  const offerId =
    bookingId.startsWith("tn-") || bookingId.includes("eco") || bookingId.includes("cmp")
      ? bookingId.replace(/^bk-/, "")
      : "tn-cmp-208-02"

  const id = bookingId.startsWith("bk-") ? bookingId : `bk-${offerId}`
  const offer = getOfferDetail(offerId) ?? getOfferDetail("tn-cmp-208-02")
  if (!offer) return null

  const isRequest = offer.confirmation === "request"
  const status: BookingStatus = isRequest ? "requested" : "confirmed"

  return buildDemoBooking({
    id,
    offerId: offer.id,
    status,
    confirmation: offer.confirmation,
    extras: ["child_seat"],
  })
}

export function findBookingByReference(
  reference: string,
  email: string,
): BookingRecord | null {
  const ref = reference.trim().toUpperCase()
  const mail = email.trim().toLowerCase()
  if (!ref || !mail) return null

  const match = listDemoTrips().find(
    (b) =>
      b.reference.toUpperCase() === ref &&
      b.contactEmail.toLowerCase() === mail,
  )
  return match ?? null
}

export type BookingNextStep = {
  label: string
  hrefSuffix?: string
  cta: string
  /** When set, link target is this path from site root (not under /bookings/:id). */
  absoluteHref?: string
}

export function nextStepForStatus(status: BookingStatus): BookingNextStep {
  switch (status) {
    case "requested":
      return {
        label: "The agency is reviewing your request. Check back here for updates.",
        cta: "Overview",
      }
    case "held":
      return {
        label: "Your rate is held. Complete payment if you still need to pay online.",
        hrefSuffix: "/payments",
        cta: "Complete payment",
      }
    case "payment_pending":
      return {
        label: "Your booking is waiting on the online deposit.",
        hrefSuffix: "/payments",
        cta: "Pay now",
      }
    case "confirmed":
      return {
        label: "You're confirmed. Add pickup to your calendar or open your voucher.",
        hrefSuffix: "/voucher",
        cta: "Open voucher",
      }
    case "active":
      return {
        label: "Your rental is in progress. Plan your return before desk closing time.",
        hrefSuffix: "/return",
        cta: "Open return guide",
      }
    case "completed":
      return {
        label: "Thanks for renting with Wheelio. Share how the trip went.",
        hrefSuffix: "/review",
        cta: "Write review",
      }
    case "cancelled":
      return {
        label: "This booking was cancelled. Start a new search when you're ready.",
        absoluteHref: "/search",
        cta: "Book again",
      }
  }
}

export function bookingTripTotal(b: BookingRecord): number {
  return b.rentalTotalTnd + b.extrasTotalTnd
}

const UPCOMING_STATUSES: BookingStatus[] = [
  "confirmed",
  "requested",
  "held",
  "payment_pending",
]

export function isPickupInFuture(
  booking: BookingRecord,
  now = new Date(),
): boolean {
  const pickup = new Date(booking.pickupAtIso)
  return !Number.isNaN(pickup.getTime()) && pickup.getTime() > now.getTime()
}

export function filterTripsByFilter(
  trips: BookingRecord[],
  filter: TripFilter,
  now = new Date(),
): BookingRecord[] {
  switch (filter) {
    case "upcoming":
      return trips.filter(
        (b) =>
          UPCOMING_STATUSES.includes(b.status) && isPickupInFuture(b, now),
      )
    case "active":
      return trips.filter((b) => b.status === "active")
    case "past":
      return trips.filter((b) => b.status === "completed")
    case "cancelled":
      return trips.filter((b) => b.status === "cancelled")
    case "all":
      return trips
  }
}

export function sortTripsByPickupDesc(trips: BookingRecord[]): BookingRecord[] {
  return [...trips].sort(
    (a, b) =>
      new Date(b.pickupAtIso).getTime() - new Date(a.pickupAtIso).getTime(),
  )
}

export function canModifyBooking(b: BookingRecord): boolean {
  return !["active", "completed", "cancelled"].includes(b.status)
}

export function canCancelBooking(b: BookingRecord): boolean {
  return !["cancelled", "completed", "active"].includes(b.status)
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
