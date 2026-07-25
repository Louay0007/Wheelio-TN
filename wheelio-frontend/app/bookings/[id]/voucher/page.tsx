import type { Metadata } from "next"
import Link from "next/link"
import { BookingVoucherClient } from "@/components/bookings/booking-voucher-client"
import { PageShell } from "@/components/page-shell"
import { getDemoBooking } from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"

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
      ? `Voucher · ${booking.reference} | Wheelio`
      : "Voucher | Wheelio",
  }
}

export default async function BookingVoucherPage({ params }: PageProps) {
  const { id } = await params
  const booking = getDemoBooking(id)
  const offer = booking ? getOfferDetail(booking.offerId) : null

  if (!booking || !offer) {
    return (
      <PageShell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-2xl font-semibold">Booking not found</h1>
          <Link
            href="/search"
            className="mt-6 inline-flex text-sm font-semibold underline"
          >
            Find a car
          </Link>
        </main>
      </PageShell>
    )
  }

  return <BookingVoucherClient booking={booking} offer={offer} />
}
