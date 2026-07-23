import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import { LOCATIONS } from "@/lib/locations"

export const metadata: Metadata = {
  title: "Car rental locations in Tunisia | Wheelio",
  description:
    "Compare rental cars at Tunis-Carthage, Tunis Centre, Monastir, Sousse, Enfidha-Hammamet, Djerba, Hammamet, and Sfax.",
}

export default function LocationsIndexPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Locations"
        title="Car rental across Tunisia"
        description="Airports and cities where partner agencies pick up. Compare totals in TND, then start a search with your place prefilled."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <ul className="divide-y divide-black/10 border-t border-black/10 dark:divide-white/10 dark:border-white/10">
          {LOCATIONS.map((place) => (
            <li key={place.slug}>
              <Link
                href={`/locations/${place.slug}`}
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
                  {place.startingFromTnd != null ? (
                    <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                      From {place.startingFromTnd} TND / day · indicative
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

        <p className="mt-10 text-sm text-black/50 dark:text-white/50">
          Looking for a category instead? Browse{" "}
          <Link href="/search" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">
            all cars
          </Link>
          .
        </p>
      </div>
    </PageShell>
  )
}
