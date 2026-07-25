"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Building2, MapPin, Star } from "lucide-react"
import { ApiEmptyState, ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import type { AppLocaleDto } from "@/lib/contracts/common"
import type { PublicAgency } from "@/lib/contracts/public-catalog"
import { usePublicAgencies } from "@/lib/query/public-catalog"

export function AgenciesDirectory({
  locale,
  city,
  initialData,
}: {
  locale: AppLocaleDto
  city?: string
  initialData: PublicAgency[]
}) {
  const agencies = usePublicAgencies(locale, city ? { city } : undefined, initialData)

  if (agencies.isPending) return <ApiLoadingState label="Loading agencies…" />
  if (agencies.isError) {
    return <ApiErrorState error={agencies.error} retry={() => agencies.refetch()} />
  }
  if (agencies.data.length === 0) {
    return (
      <ApiEmptyState
        title="No agencies match this filter"
        description="Clear the city filter or check again later."
      />
    )
  }

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agencies.data.map((agency) => (
        <li key={agency.id}>
          <Link
            href={`/agencies/${agency.slug}?locale=${locale}`}
            className="flex h-full flex-col rounded-[8px] border border-black/10 p-5 transition hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
          >
            <div className="flex items-start gap-3">
              <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-800">
                {agency.logoUrl ? (
                  <Image
                    src={agency.logoUrl}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain p-1.5"
                  />
                ) : (
                  <Building2 className="size-5 text-black/35 dark:text-white/35" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold tracking-[-0.02em]">
                  {agency.name}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-black/50 dark:text-white/50">
                  <MapPin className="size-3.5 shrink-0" />
                  {agency.city}
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
                {agency.instantEnabled ? "Instant booking" : "Booking request"}
              </span>
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold">
              View profile
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
