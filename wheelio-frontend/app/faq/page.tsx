import type { Metadata } from "next"
import { PageHero, PageShell } from "@/components/page-shell"
import { FaqClient } from "@/components/faq/faq-client"

export const metadata: Metadata = {
  title: "FAQ | Wheelio",
  description:
    "Answers about booking, deposits, documents, airport pickup, cancellation, and payments for car rental in Tunisia.",
}

export default function FaqPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="FAQ"
        title="Questions about renting in Tunisia"
        description="Plain-language answers for Wheelio bookings: Instant vs Request, TND totals, deposits, documents, and pickup."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <FaqClient />
      </div>
    </PageShell>
  )
}
