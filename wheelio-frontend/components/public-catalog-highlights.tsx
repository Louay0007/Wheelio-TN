"use client"

import Link from "next/link"
import { ArrowUpRight, MapPin } from "lucide-react"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import type { PublicBootstrap } from "@/lib/contracts/public-catalog"
import { usePublicBootstrap } from "@/lib/query/public-catalog"

export function PublicCatalogHighlights({
  initialData,
}: {
  initialData: PublicBootstrap
}) {
  const catalog = usePublicBootstrap(initialData.locale, initialData)

  if (catalog.isPending) return <ApiLoadingState label="Loading destinations…" />
  if (catalog.isError) {
    return <ApiErrorState error={catalog.error} retry={() => catalog.refetch()} />
  }

  return (
    <section className="bg-white py-16 dark:bg-zinc-900 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              Explore Tunisia
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Popular pickup locations
            </h2>
          </div>
          <Link
            href={`/locations?locale=${catalog.data.locale}`}
            className="inline-flex items-center gap-1 text-sm font-semibold"
          >
            All locations <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.data.featuredLocations.map((location) => (
            <li key={location.id}>
              <Link
                href={`/locations/${location.slug}?locale=${catalog.data.locale}`}
                className="flex h-full items-start gap-3 rounded-lg border border-black/10 p-5 transition hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
              >
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block font-semibold">{location.name}</span>
                  <span className="mt-1 block text-sm text-black/50 dark:text-white/50">
                    {location.blurb}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h3 className="text-lg font-semibold">Browse by category</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {catalog.data.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category=${encodeURIComponent(category.code)}`}
                  className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Featured agencies</h3>
              <Link
                href={`/agencies?locale=${catalog.data.locale}`}
                className="text-sm font-semibold"
              >
                View all
              </Link>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {catalog.data.featuredAgencies.map((agency) => (
                <li key={agency.id}>
                  <Link
                    href={`/agencies/${agency.slug}?locale=${catalog.data.locale}`}
                    className="flex items-center justify-between rounded-lg border border-black/10 p-4 transition hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
                  >
                    <span>
                      <span className="block font-semibold">{agency.name}</span>
                      <span className="mt-1 block text-sm text-black/50 dark:text-white/50">
                        {agency.city} · {agency.rating.toFixed(1)} / 5
                      </span>
                    </span>
                    <ArrowUpRight className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
