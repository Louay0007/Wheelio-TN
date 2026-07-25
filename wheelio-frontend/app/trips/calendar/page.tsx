import type { Metadata } from "next"
import { TripsCalendarClient } from "./trips-calendar-client"

export const metadata: Metadata = {
  title: "Trip calendar | Wheelio TN",
  description:
    "Month and agenda views of your Wheelio TN rentals in Africa/Tunis local time.",
}

export default function TripsCalendarPage() {
  return <TripsCalendarClient />
}
