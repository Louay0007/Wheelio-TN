import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight, MapPin, Star } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import {
  getAgency,
  listAgencySlugs,
  searchHrefForAgency,
} from "@/lib/agencies"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return listAgencySlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const agency = getAgency(slug)
  if (!agency) return { title: "Agency | Wheelio" }
  return {
    title: `${agency.name} | Wheelio TN`,
    description: `Compare ${agency.name} rental offers in ${agency.cities.join(", ")}. Rating ${agency.rating.toFixed(1)}. Prices in TND.`,
  }
}

export default async function AgencyProfilePage({ params }: PageProps) {
  const { slug } = await params
  const agency = getAgency(slug)
  if (!agency) notFound()

  return (
    <PageShell>
      <PageHero
        eyebrow="Agency profile"
        title={agency.name}
        description={`Local partner covering ${agency.cities.join(", ")}. Compare their live offers on Wheelio in TND.`}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-start gap-6 border-b border-black/10 pb-10 dark:border-white/10">
          <div className="relative size-20 overflow-hidden rounded-[8px] border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-800">
            <Image src={agency.logo} alt="" fill className="object-contain p-2" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Star className="size-4 fill-current" />
                {agency.rating.toFixed(1)}
                <span className="font-normal text-black/45 dark:text-white/45">
                  · {agency.reviewCount} reviews
                </span>
              </span>
              <span className="text-black/50 dark:text-white/50">
                {agency.offerCount} sample offer{agency.offerCount === 1 ? "" : "s"} ·{" "}
                {agency.instantShare}% instant
              </span>
            </div>
            <p className="mt-4 max-w-2xl rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-relaxed text-black/65 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/65">
              {agency.verificationNote}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Branches & pickup points</h2>
            <ul className="mt-4 space-y-3">
              {agency.locationLabels.map((label) => (
                <li
                  key={label}
                  className="flex items-start gap-2 text-sm text-black/65 dark:text-white/65"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-lg font-semibold tracking-[-0.02em]">Policy highlights</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-black/65 dark:text-white/65">
              {agency.policies.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Reviews excerpt</h2>
            <ul className="mt-4 space-y-4">
              {agency.reviewsExcerpt.map((r) => (
                <li
                  key={r.quote}
                  className="rounded-[8px] border border-black/10 p-4 dark:border-white/10"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Star className="size-3.5 fill-current" />
                    {r.rating}.0 · {r.name}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
                    “{r.quote}”
                  </p>
                </li>
              ))}
            </ul>
            <Link
              href="/reviews"
              className="mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              See all reviews
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href={searchHrefForAgency(agency.name)}
            className="inline-flex h-11 items-center gap-2 rounded-[7px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            View available cars
            <ArrowUpRight className="size-4" />
          </Link>
          <Link
            href="/agencies"
            className="inline-flex h-11 items-center rounded-[7px] border border-black/15 px-5 text-sm font-semibold dark:border-white/15"
          >
            All agencies
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
