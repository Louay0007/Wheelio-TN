import type { Metadata } from "next"
import { PageHero, PageShell } from "@/components/page-shell"
import { TripsHubClient } from "@/components/bookings/trips-hub-client"

export const metadata: Metadata = {
  title: "Your trips | Wheelio TN",
  description:
    "Upcoming, active, and past car rentals in Tunisia — manage bookings without an account.",
}

export default function TripsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Trips"
        title="Your trips"
        description="Demo trips from sample bookings. Filter by status or find a guest booking by reference."
      />
      <TripsHubClient />
    </PageShell>
  )
}
