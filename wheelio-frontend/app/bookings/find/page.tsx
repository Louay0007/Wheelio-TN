import type { Metadata } from "next"
import { FindBookingClient } from "./find-booking-client"

export const metadata: Metadata = {
  title: "Find a booking | Wheelio TN",
  description: "Look up a Wheelio TN demo booking by reference and email.",
}

export default function FindBookingPage() {
  return <FindBookingClient />
}
