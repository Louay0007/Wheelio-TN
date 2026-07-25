import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import {
  guideArticleSchema,
  parseStructuredContent,
} from "@/lib/contracts/content"
import { getRequestLocale } from "@/lib/i18n/server"
import { listTypedContent } from "@/server/modules/reviews-content/application/get-typed-content"

export const metadata: Metadata = {
  title: "Guides | Wheelio TN",
  description:
    "Practical guides for renting a car in Tunisia: documents, airport pickup, deposits, manuals vs automatics, and summer tips.",
}

type PageProps = {
  searchParams: Promise<{ locale?: string }>
}

export default async function GuidesIndexPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale((await searchParams).locale)
  const content = await listTypedContent("guide", locale)
  const guides = content.map((item) =>
    parseStructuredContent(item, guideArticleSchema),
  )

  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        title="Guides for renting in Tunisia"
        description="Short editorial articles to help you compare agencies with confidence — documents, pickups, deposits, and peak-season tips."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <ul className="grid gap-4 sm:grid-cols-2">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}?locale=${locale}`}
                className="group flex h-full flex-col rounded-[8px] border border-black/10 p-6 transition hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
              >
                <p className="text-xs text-black/45 dark:text-white/45">
                  {guide.readMinutes} min read · Updated {guide.updated}
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">
                  {guide.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-black/55 dark:text-white/55">
                  {guide.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                  Read guide
                  <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <Link
            href="/search"
            className="inline-flex h-11 items-center gap-2 rounded-[7px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Find a car
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
