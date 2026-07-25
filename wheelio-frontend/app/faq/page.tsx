import type { Metadata } from "next"
import { PageHero, PageShell } from "@/components/page-shell"
import { FaqClient } from "@/components/faq/faq-client"
import { getRequestLocale } from "@/lib/i18n/server"
import { listTypedContent } from "@/server/modules/reviews-content/application/get-typed-content"

export const metadata: Metadata = {
  title: "FAQ | Wheelio",
  description:
    "Answers about booking, deposits, documents, airport pickup, cancellation, and payments for car rental in Tunisia.",
}

type PageProps = {
  searchParams: Promise<{ locale?: string }>
}

export default async function FaqPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale((await searchParams).locale)
  const content = await listTypedContent("faq", locale)

  return (
    <PageShell>
      <PageHero
        eyebrow="FAQ"
        title="Questions about renting in Tunisia"
        description="Plain-language answers for Wheelio bookings: Instant vs Request, TND totals, deposits, documents, and pickup."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <FaqClient locale={locale} initialData={content} />
      </div>
    </PageShell>
  )
}
