"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ApiEmptyState, ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import type { AppLocaleDto } from "@/lib/contracts/common"
import type { PublicLocation } from "@/lib/contracts/public-catalog"
import { usePublicLocations } from "@/lib/query/public-catalog"

export function LocationsDirectory({
  locale,
  initialData,
}: {
  locale: AppLocaleDto
  initialData: PublicLocation[]
}) {
  const locations = usePublicLocations(locale, initialData)

  if (locations.isPending) return <ApiLoadingState label="Loading locations…" />
  if (locations.isError) {
    return <ApiErrorState error={locations.error} retry={() => locations.refetch()} />
  }
  if (locations.data.length === 0) {
    return (
      <ApiEmptyState
        title="No locations are published yet"
        description="Please check again soon."
      />
    )
  }

  return (
    <ul className="divide-y divide-black/10 dark:divide-white/10 dark:border-white/10">
      {locations.data.map((place) => (
        <li key={place.id}>
          <Link
            href={`/locations/${place.slug}?locale=${locale}`}
            className="group grid gap-2 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8"
          >
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-xl font-semibold tracking-[-0.03em] group-hover:underline sm:text-2xl">
                  {place.name}
                </h2>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
                  {place.type === "airport" ? "Airport" : "City"} · {place.region}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/55 dark:text-white/55">
                {place.blurb}
              </p>
              {place.startingFrom ? (
                <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                  From {Number(place.startingFrom.amountMillimes) / 1000} TND / day · indicative
                </p>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-black/50 transition group-hover:text-black dark:text-white/50 dark:group-hover:text-white">
              View location
              <ArrowUpRight className="size-4" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
