import type { Metadata } from "next"
import Link from "next/link"
import { BookingScheduleClient } from "@/components/bookings/booking-schedule-client"
import { BookingShell } from "@/components/bookings/booking-shell"
import { getDemoBooking } from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"
import { PageShell } from "@/components/page-shell"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const booking = getDemoBooking(id)
  return {
    title: booking
      ? `Schedule · ${booking.reference} | Wheelio`
      : "Schedule | Wheelio",
  }
}

export default async function BookingSchedulePage({ params }: PageProps) {
  const { id } = await params
  const booking = getDemoBooking(id)

  if (!booking) {
    return (
      <PageShell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-2xl font-semibold">Booking not found</h1>
          <Link
            href="/bookings/find"
            className="mt-6 inline-flex text-sm font-semibold underline"
          >
            Find a booking
          </Link>
        </main>
      </PageShell>
    )
  }

  const offer = getOfferDetail(booking.offerId)
  if (!offer) {
    return (
      <PageShell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-2xl font-semibold">Offer unavailable</h1>
        </main>
      </PageShell>
    )
  }

  return (
    <BookingShell booking={booking} offer={offer} headerEyebrow="Schedule">
      <BookingScheduleClient booking={booking} offer={offer} />
    </BookingShell>
  )
}
