import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getDemoBooking } from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"
import { ReviewClient } from "./review-client"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const booking = getDemoBooking(id)
  return {
    title: booking
      ? `Review · ${booking.reference} | Wheelio TN`
      : "Review | Wheelio TN",
  }
}

export default async function BookingReviewPage({ params }: PageProps) {
  const { id } = await params
  const booking = getDemoBooking(id)
  if (!booking) notFound()

  const offer = getOfferDetail(booking.offerId)
  if (!offer) notFound()

  return <ReviewClient booking={booking} offer={offer} />
}
