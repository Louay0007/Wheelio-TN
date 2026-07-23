import type { Metadata } from "next"
import { ManageBookingClient } from "@/components/bookings/manage-booking-client"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Manage ${id} | Wheelio` }
}

export default async function ManageBookingPage({ params }: PageProps) {
  const { id } = await params
  return <ManageBookingClient bookingId={id} />
}
