import type { BookingRecord } from "@/lib/bookings"
import { listDemoTrips } from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"

export type DemoNotification = {
  id: string
  bookingId: string
  reference: string
  title: string
  body: string
  at: string
  actionNeeded: boolean
  href: string
}

function hrefForBooking(booking: BookingRecord): string {
  if (booking.status === "payment_pending") {
    return `/bookings/${booking.id}/payments`
  }
  if (booking.status === "completed") {
    return `/bookings/${booking.id}/review`
  }
  if (booking.status === "confirmed" || booking.status === "active") {
    return `/bookings/${booking.id}/schedule`
  }
  return `/bookings/${booking.id}`
}

function actionNeededForStatus(status: BookingRecord["status"]): boolean {
  return (
    status === "payment_pending" ||
    status === "requested" ||
    status === "held"
  )
}

export function buildDemoNotifications(trips: BookingRecord[]): DemoNotification[] {
  const items: DemoNotification[] = []

  for (const booking of trips) {
    const offer = getOfferDetail(booking.offerId)
    const vehicle = offer
      ? `${offer.modelName}${offer.orSimilar ? " or similar" : ""}`
      : "Your rental"

    for (const entry of booking.timeline) {
      items.push({
        id: `${booking.id}-${entry.status}-${entry.at}`,
        bookingId: booking.id,
        reference: booking.reference,
        title: entry.label,
        body: `${vehicle} · ${booking.reference}`,
        at: entry.at,
        actionNeeded: actionNeededForStatus(entry.status),
        href: hrefForBooking(booking),
      })
    }

    if (booking.status === "active") {
      items.push({
        id: `${booking.id}-return-reminder`,
        bookingId: booking.id,
        reference: booking.reference,
        title: "Return window approaching",
        body: `Plan your drop-off for ${booking.returnLabel}.`,
        at: booking.returnAtIso,
        actionNeeded: true,
        href: `/bookings/${booking.id}/return`,
      })
    }
  }

  return items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
}

export function listDemoNotifications(): DemoNotification[] {
  return buildDemoNotifications(listDemoTrips())
}
