import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight, Building2, MapPin, Star } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import { publicAgencyDetailSchema } from "@/lib/contracts/public-catalog"
import { getRequestLocale } from "@/lib/i18n/server"
import { getPublicAgency } from "@/server/modules/fleet/application/public-catalog"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locale?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const agency = publicAgencyDetailSchema.parse(
      await getPublicAgency(slug, "en"),
    )
    return {
      title: `${agency.name} | Wheelio TN`,
      description: `Compare ${agency.name} rental offers in ${agency.city}. Rating ${agency.rating.toFixed(1)}. Prices in TND.`,
    }
  } catch {
    return { title: "Agency | Wheelio" }
  }
}

export default async function AgencyProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params
  const locale = await getRequestLocale((await searchParams).locale)
  let agency
  try {
    agency = publicAgencyDetailSchema.parse(
      await getPublicAgency(slug, locale),
    )
  } catch {
    notFound()
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Agency profile"
        title={agency.name}
        description={`Local partner in ${agency.city}. Compare their live offers on Wheelio in TND.`}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-start gap-6 pb-10 dark:border-white/10">
          <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-[8px] border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-800">
            {agency.logoUrl ? (
              <Image
                src={agency.logoUrl}
                alt=""
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            ) : (
              <Building2 className="size-7 text-black/35 dark:text-white/35" />
            )}
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
                {agency.instantEnabled ? "Instant booking" : "Booking request"}
              </span>
            </div>
            <p className="mt-4 max-w-2xl rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-relaxed text-black/65 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/65">
              Verified marketplace partner. Always review the offer policies before booking.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Pickup area</h2>
            <p className="mt-4 flex items-start gap-2 text-sm text-black/65 dark:text-white/65">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {agency.pickupDescription || agency.city}
            </p>

            <h2 className="mt-10 text-lg font-semibold tracking-[-0.02em]">About</h2>
            <p className="mt-4 text-sm leading-relaxed text-black/65 dark:text-white/65">
              {agency.bio || `${agency.name} is a Wheelio rental partner in ${agency.city}.`}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Reviews excerpt</h2>
            <ul className="mt-4 space-y-4">
              {agency.reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-[8px] border border-black/10 p-4 dark:border-white/10"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Star className="size-3.5 fill-current" />
                    {review.rating}.0 · {review.authorDisplayName}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
                    “{review.body}”
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
            href={`/search?agency=${encodeURIComponent(agency.name)}`}
            className="inline-flex h-11 items-center gap-2 rounded-[7px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            View available cars
            <ArrowUpRight className="size-4" />
          </Link>
          <Link
            href={`/agencies?locale=${locale}`}
            className="inline-flex h-11 items-center rounded-[7px] border border-black/15 px-5 text-sm font-semibold dark:border-white/15"
          >
            All agencies
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
