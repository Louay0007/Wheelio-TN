import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getDemoBooking } from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"
import { ClaimClient } from "./claim-client"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const booking = getDemoBooking(id)
  return {
    title: booking
      ? `Report issue · ${booking.reference} | Wheelio TN`
      : "Report issue | Wheelio TN",
  }
}

export default async function BookingClaimPage({ params }: PageProps) {
  const { id } = await params
  const booking = getDemoBooking(id)
  if (!booking) notFound()

  const offer = getOfferDetail(booking.offerId)
  if (!offer) notFound()

  return <ClaimClient booking={booking} offer={offer} />
}
