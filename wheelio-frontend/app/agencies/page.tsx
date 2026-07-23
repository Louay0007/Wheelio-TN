import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, MapPin, Star } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import { listAgencies, listAgencyCities } from "@/lib/agencies"

export const metadata: Metadata = {
  title: "Rental agencies | Wheelio TN",
  description:
    "Browse verified Tunisian car rental agencies on Wheelio. Compare ratings, cities, and offers in TND.",
}

type PageProps = {
  searchParams: Promise<{ city?: string }>
}

export default async function AgenciesDirectoryPage({ searchParams }: PageProps) {
  const { city } = await searchParams
  const cities = listAgencyCities()
  const agencies = listAgencies().filter(
    (a) => !city || a.cities.some((c) => c.toLowerCase() === city.toLowerCase()),
  )

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
            href="/agencies"
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
              href={`/agencies?city=${encodeURIComponent(c)}`}
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

        {agencies.length === 0 ? (
          <p className="mt-10 text-black/55 dark:text-white/55">
            No agencies match this city filter.{" "}
            <Link href="/agencies" className="font-medium underline underline-offset-4">
              Clear filter
            </Link>
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => (
              <li key={agency.slug}>
                <Link
                  href={`/agencies/${agency.slug}`}
                  className="flex h-full flex-col rounded-[8px] border border-black/10 p-5 transition hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-[6px] border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-800">
                      <Image
                        src={agency.logo}
                        alt=""
                        fill
                        className="object-contain p-1.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold tracking-[-0.02em]">
                        {agency.name}
                      </h2>
                      <p className="mt-1 flex items-center gap-1 text-sm text-black/50 dark:text-white/50">
                        <MapPin className="size-3.5 shrink-0" />
                        {agency.cities.join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Star className="size-3.5 fill-current" />
                      {agency.rating.toFixed(1)}
                      <span className="font-normal text-black/45 dark:text-white/45">
                        ({agency.reviewCount})
                      </span>
                    </span>
                    <span className="text-black/45 dark:text-white/45">
                      {agency.instantShare}% instant
                    </span>
                  </div>
                  <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                    View profile
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

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
