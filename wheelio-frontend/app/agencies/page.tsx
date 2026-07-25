import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import { publicAgencySchema } from "@/lib/contracts/public-catalog"
import { getRequestLocale } from "@/lib/i18n/server"
import { listPublicAgencies } from "@/server/modules/fleet/application/public-catalog"
import { AgenciesDirectory } from "./agencies-directory"

export const metadata: Metadata = {
  title: "Rental agencies | Wheelio TN",
  description:
    "Browse verified Tunisian car rental agencies on Wheelio. Compare ratings, cities, and offers in TND.",
}

type PageProps = {
  searchParams: Promise<{ city?: string; locale?: string }>
}

export default async function AgenciesDirectoryPage({ searchParams }: PageProps) {
  const { city, locale: requestedLocale } = await searchParams
  const locale = await getRequestLocale(requestedLocale)
  const allAgencies = publicAgencySchema
    .array()
    .parse(await listPublicAgencies({ locale }))
  const cities = [...new Set(allAgencies.map((agency) => agency.city))].sort()
  const agencies = city
    ? allAgencies.filter(
        (agency) => agency.city.toLowerCase() === city.toLowerCase(),
      )
    : allAgencies

  return (
    <PageShell>
      <PageHero
        eyebrow="Partners"
        title="Rental agencies across Tunisia"
        description="Wheelio lists local agencies so you can compare totals, deposits, and confirmation types — we are a marketplace, not a fleet owner."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-black/50 dark:text-white/50">Filter by city</span>
          <Link
            href={`/agencies?locale=${locale}`}
            className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition ${
              !city
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/10 hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.04]"
            }`}
          >
            All
          </Link>
          {cities.map((c) => (
            <Link
              key={c}
              href={`/agencies?city=${encodeURIComponent(c)}&locale=${locale}`}
              className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition ${
                city?.toLowerCase() === c.toLowerCase()
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-black/10 hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.04]"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        <AgenciesDirectory
          locale={locale}
          city={city}
          initialData={agencies}
        />

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-black/45 dark:text-white/45">
          Verification means Wheelio has reviewed business documents for listing — not a government
          badge or quality guarantee. Always read offer policies before booking.
        </p>

        <div className="mt-8">
          <Link
            href="/search"
            className="inline-flex h-11 items-center gap-2 rounded-[7px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Compare cars
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
