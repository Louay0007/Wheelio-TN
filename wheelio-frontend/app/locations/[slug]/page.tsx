import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import {
  publicCategorySchema,
  publicLocationSchema,
} from "@/lib/contracts/public-catalog"
import { getRequestLocale } from "@/lib/i18n/server"
import {
  getPublishedLocation,
  listPublishedCategories,
  listPublishedLocations,
} from "@/server/modules/fleet/application/public-catalog"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locale?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const place = publicLocationSchema.parse(
      await getPublishedLocation(slug, "en"),
    )
    return {
      title: `Car rental in ${place.shortName} | Wheelio`,
      description: place.intro.slice(0, 155),
    }
  } catch {
    return { title: "Locations | Wheelio" }
  }
}

export default async function LocationPage({ params, searchParams }: Props) {
  const { slug } = await params
  const requestedLocale = (await searchParams).locale
  const locale = await getRequestLocale(requestedLocale)
  let place
  try {
    place = publicLocationSchema.parse(
      await getPublishedLocation(slug, locale),
    )
  } catch {
    notFound()
  }
  const [allLocations, categories] = await Promise.all([
    listPublishedLocations(locale),
    listPublishedCategories(locale),
  ])
  const others = publicLocationSchema
    .array()
    .parse(allLocations)
    .filter((location) => location.slug !== slug)
  const popularCategories = publicCategorySchema.array().parse(categories)
  const searchHref = `/search?pickup=${encodeURIComponent(place.searchPickup)}`

  return (
    <PageShell>
      <PageHero
        eyebrow={`${place.type === "airport" ? "Airport" : "City"} · ${place.region}`}
        title={`Car rental in ${place.shortName}`}
        description={place.intro}
      />

      <div className="dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="max-w-xl text-sm leading-relaxed text-black/55 dark:text-white/55">
            Start a search with <span className="font-medium text-black dark:text-white">{place.searchPickup}</span> as
            pickup. You can change dates and return location on the next step.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={searchHref}
              className="inline-flex h-11 items-center gap-2 rounded-[7px] bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Search cars
              <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/#search"
              className="inline-flex h-11 items-center rounded-[7px] border border-black/20 px-5 text-sm font-semibold transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              Open home search
            </Link>
          </div>
        </div>
        {place.startingFrom ? (
          <p className="mx-auto max-w-7xl px-4 pb-8 text-sm text-black/50 dark:text-white/50 sm:px-6">
            Indicative from {Number(place.startingFrom.amountMillimes) / 1000} TND per day — live totals depend on dates and agency.
          </p>
        ) : null}
      </div>

      <section className="dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            Popular categories
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {popularCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/search?category=${encodeURIComponent(category.code)}&pickup=${encodeURIComponent(place.searchPickup)}`}
                  className="inline-flex rounded-[7px] border border-black/15 px-4 py-2.5 text-sm font-medium transition hover:border-black/40 dark:border-white/15 dark:hover:border-white/40"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Pickup tips</h2>
          <ol className="mt-8 divide-y divide-black/10 dark:divide-white/10 dark:border-white/10">
            {place.pickupTips.map((tip, i) => (
              <li
                key={tip}
                className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 py-5 text-[15px] leading-relaxed"
              >
                <span className="text-sm font-semibold text-black/35 dark:text-white/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-black/70 dark:text-white/70">{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">
            FAQ for {place.shortName}
          </h2>
          <dl className="mt-8 divide-y divide-black/10 dark:divide-white/10 dark:border-white/10">
            {place.faqs.map((faq) => (
              <div key={faq.question} className="py-6">
                <dt className="font-medium">{faq.question}</dt>
                <dd className="mt-2 max-w-3xl text-[15px] leading-relaxed text-black/55 dark:text-white/55">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-black/50 dark:text-white/50">
            More answers in the{" "}
            <Link href="/faq" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">
              full FAQ
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
          Other locations
        </h2>
        <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((loc) => (
            <li key={loc.slug}>
              <Link
                href={`/locations/${loc.slug}`}
                className="text-base font-medium underline-offset-2 hover:underline"
              >
                {loc.shortName}
              </Link>
              <span className="ml-2 text-sm text-black/40 dark:text-white/40">
                {loc.type === "airport" ? "Airport" : "City"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}
