import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Briefcase,
  Fuel,
  MapPin,
  Snowflake,
  Star,
  Users,
  Cog,
} from "lucide-react"
import type { RentalOffer } from "@/lib/search-types"
import { formatTnd } from "@/lib/search-utils"

type OfferCardProps = {
  offer: RentalOffer
  days: number
  tripQuery?: string
}

function Spec({
  icon,
  label,
}: {
  icon: ReactNode
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
      <span className="text-black/40 dark:text-white/40">{icon}</span>
      {label}
    </span>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[5px] border border-black/15 bg-black/[0.03] px-2 py-0.5 text-[11px] font-medium text-black/75 dark:border-white/15 dark:bg-white/[0.05] dark:text-white/75">
      {children}
    </span>
  )
}

export function OfferCard({ offer, days, tripQuery }: OfferCardProps) {
  const perDay = Math.round(offer.totalPriceTnd / days)
  const dealHref = tripQuery
    ? `/cars/${offer.id}?${tripQuery}`
    : `/cars/${offer.id}`
  const transmissionLabel =
    offer.transmission === "automatic" ? "Automatic" : "Manual"
  const fuelLabel =
    offer.fuel.charAt(0).toUpperCase() + offer.fuel.slice(1)

  return (
    <article className="group overflow-hidden rounded-[14px] border border-black/10 bg-white transition hover:border-black/25 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/25">
      <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)_200px]">
        <div className="relative aspect-[16/11] overflow-hidden bg-zinc-100 dark:bg-zinc-800 lg:aspect-auto lg:min-h-[200px]">
          <Image
            src={offer.image}
            alt={`${offer.modelName} rental car`}
            fill
            sizes="(max-width: 1024px) 100vw, 240px"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-[5px] bg-white/95 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-black dark:bg-black/90 dark:text-white">
              {offer.categoryLabel}
            </span>
            {offer.sponsored && (
              <span className="rounded-[5px] bg-black/90 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-white/95 dark:text-black">
                Sponsored
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-black/10 p-4 dark:border-white/10 sm:p-5 lg:border-b-0 lg:border-r">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-black dark:text-white">
              {offer.modelName}
              {offer.orSimilar && (
                <span className="ml-1.5 text-sm font-normal text-black/45 dark:text-white/45">
                  or similar
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-black/50 dark:text-white/50">
              {offer.categoryLabel} · {offer.doors} doors
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Spec icon={<Users className="size-3.5" />} label={`${offer.seats} seats`} />
            <Spec icon={<Briefcase className="size-3.5" />} label={`${offer.bags} bags`} />
            <Spec icon={<Cog className="size-3.5" />} label={transmissionLabel} />
            {offer.airConditioning && (
              <Spec icon={<Snowflake className="size-3.5" />} label="A/C" />
            )}
            <Spec icon={<Fuel className="size-3.5" />} label={fuelLabel} />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-black/10 bg-black/[0.02] px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-[9px] border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-900">
              <Image
                src={offer.agency.logo}
                alt={`${offer.agency.name} logo`}
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="truncate text-sm font-semibold text-black dark:text-white">
                  {offer.agency.name}
                </p>
                <span className="inline-flex items-center gap-0.5 text-sm text-black/70 dark:text-white/70">
                  <Star className="size-3.5 fill-current" />
                  <span className="font-semibold tabular-nums">
                    {offer.agency.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-black/40 dark:text-white/40">
                    ({offer.agency.reviewCount})
                  </span>
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-black/50 dark:text-white/50">
                <MapPin className="size-3 shrink-0" />
                {offer.agency.locationLabel}
                <span className="text-black/30 dark:text-white/30">·</span>
                {offer.agency.city}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge>
              {offer.confirmation === "instant" ? "Instant" : "Request to book"}
            </Badge>
            {offer.cancellation === "free" && <Badge>Free cancellation</Badge>}
            {offer.cancellation === "non_refundable" && (
              <Badge>Non-refundable</Badge>
            )}
            {offer.mileage === "unlimited" && <Badge>Unlimited km</Badge>}
            {offer.mileage === "limited" && <Badge>Limited km</Badge>}
            {offer.pickupMethod === "meet_greet" && <Badge>Meet & greet</Badge>}
            {offer.pickupMethod === "delivery" && <Badge>Delivery</Badge>}
          </div>

          <div className="space-y-1 text-xs leading-relaxed text-black/45 dark:text-white/45">
            <p>{offer.cancellationNote}</p>
            <p>
              {offer.mileageNote} · {offer.pickupMethodNote}
            </p>
            {offer.included.length > 0 && (
              <p className="pt-0.5 text-black/55 dark:text-white/55">
                Includes: {offer.included.slice(0, 3).join(" · ")}
                {offer.included.length > 3 ? "…" : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 p-4 sm:p-5 lg:items-end lg:text-right">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/40 dark:text-white/40">
              Total · {days} day{days === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] tabular-nums text-black dark:text-white">
              {formatTnd(offer.totalPriceTnd)}
            </p>
            <p className="mt-0.5 text-sm text-black/50 dark:text-white/50">
              {formatTnd(perDay)} / day
            </p>
            <p className="mt-3 text-xs leading-snug text-black/45 dark:text-white/45">
              Refundable deposit from {formatTnd(offer.depositTnd)}
            </p>
          </div>

          <Link
            href={dealHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:outline-white lg:w-auto"
          >
            View deal
          </Link>
        </div>
      </div>
    </article>
  )
}

export function OfferCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-black/10 dark:border-white/10">
      <div className="grid animate-pulse gap-0 lg:grid-cols-[240px_minmax(0,1fr)_200px]">
        <div className="aspect-[16/11] bg-zinc-200 dark:bg-zinc-800 lg:aspect-auto lg:min-h-[200px]" />
        <div className="space-y-3 border-b border-black/10 p-5 dark:border-white/10 lg:border-b-0 lg:border-r">
          <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex gap-3">
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-[9px] bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
        <div className="space-y-3 p-5 lg:text-right">
          <div className="ml-auto h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="ml-auto h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="ml-auto h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="ml-auto h-11 w-28 rounded-[8px] bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
