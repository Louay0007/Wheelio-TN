"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Filter,
  MapPin,
  RefreshCw,
  SearchX,
  SlidersHorizontal,
  UserRound,
} from "lucide-react"
import { Footer } from "@/components/footer"
import { FiltersPanel } from "@/components/search/filters-panel"
import { OfferCard, OfferCardSkeleton } from "@/components/search/offer-card"
import { SiteHeader } from "@/components/search/site-header"
import { TripSummaryBar } from "@/components/search/trip-summary-bar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SEARCH_OFFERS } from "@/lib/search-offers"
import type { SearchFilters, SortOption, TripQuery } from "@/lib/search-types"
import {
  countActiveFilters,
  defaultFilters,
  driverAgeLabel,
  filterOffers,
  formatTripDate,
  parseTripQuery,
  rentalDays,
  sortOffers,
  tripToSearchParams,
} from "@/lib/search-utils"

const LOCATIONS = [
  "Tunis-Carthage Airport",
  "Tunis Centre",
  "Monastir Airport",
  "Sousse",
  "Djerba-Zarzis Airport",
  "Enfidha-Hammamet Airport",
  "Hammamet",
  "Sfax",
]

const TIMES = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
  const minute = index % 2 === 0 ? "00" : "30"
  return `${String(hour).padStart(2, "0")}:${minute}`
})

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "total_price", label: "Total price" },
  { value: "rating", label: "Rating" },
  { value: "deposit", label: "Deposit" },
  { value: "capacity", label: "Capacity" },
]

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getFallbackTrip(): TripQuery {
  const pickup = new Date()
  pickup.setDate(pickup.getDate() + 1)
  const dropoff = new Date(pickup)
  dropoff.setDate(dropoff.getDate() + 6)

  return {
    pickupLocation: "Tunis-Carthage Airport",
    dropoffLocation: "Tunis-Carthage Airport",
    pickupDate: toDateInput(pickup),
    pickupTime: "10:00",
    dropoffDate: toDateInput(dropoff),
    dropoffTime: "10:00",
    driverAge: "30",
    differentReturn: false,
  }
}

const controlClassName =
  "h-12 w-full appearance-none rounded-[8px] border border-black/15 bg-black/[0.04] px-3 pr-9 text-sm text-black outline-none transition hover:border-black/35 focus:border-black focus:ring-2 focus:ring-black/15 dark:border-white/15 dark:bg-white/[0.07] dark:text-white dark:hover:border-white/35 dark:focus:border-white dark:focus:ring-white/20"
const dateControlClassName =
  "h-12 w-full rounded-[8px] border border-black/15 bg-black/[0.04] px-3 text-sm text-black outline-none transition [color-scheme:light] hover:border-black/35 focus:border-black focus:ring-2 focus:ring-black/15 dark:border-white/15 dark:bg-white/[0.07] dark:text-white dark:[color-scheme:dark] dark:hover:border-white/35 dark:focus:border-white dark:focus:ring-white/20"
const optionClassName = "bg-white text-black dark:bg-black dark:text-white"

type LoadState = "loading" | "ready" | "error"

export function SearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const fallbackTrip = useMemo(() => getFallbackTrip(), [])
  const trip = useMemo(
    () => parseTripQuery(searchParams, fallbackTrip),
    [searchParams, fallbackTrip],
  )
  const days = rentalDays(trip.pickupDate, trip.dropoffDate)

  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [sort, setSort] = useState<SortOption>("recommended")
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [modifyOpen, setModifyOpen] = useState(false)
  const [draftTrip, setDraftTrip] = useState(trip)

  useEffect(() => {
    setDraftTrip(trip)
  }, [trip])

  useEffect(() => {
    setLoadState("loading")
    const timer = window.setTimeout(() => setLoadState("ready"), 700)
    return () => window.clearTimeout(timer)
  }, [searchParams])

  const filtered = useMemo(
    () => sortOffers(filterOffers(SEARCH_OFFERS, filters), sort),
    [filters, sort],
  )
  const activeFilterCount = countActiveFilters(filters)

  const applyTrip = (next: TripQuery) => {
    startTransition(() => {
      router.push(`/search?${tripToSearchParams(next).toString()}`)
      setModifyOpen(false)
    })
  }

  const widenDates = () => {
    const pickup = new Date(`${trip.pickupDate}T12:00:00`)
    const dropoff = new Date(`${trip.dropoffDate}T12:00:00`)
    pickup.setDate(pickup.getDate() - 1)
    dropoff.setDate(dropoff.getDate() + 1)
    applyTrip({
      ...trip,
      pickupDate: toDateInput(pickup),
      dropoffDate: toDateInput(dropoff),
    })
  }

  const nearbyLocation = () => {
    applyTrip({
      ...trip,
      pickupLocation: "Tunis Centre",
      dropoffLocation: trip.differentReturn ? trip.dropoffLocation : "Tunis Centre",
    })
  }

  return (
    <div className="min-h-screen bg-white text-black transition-colors dark:bg-zinc-900 dark:text-white">
      <SiteHeader />
      <TripSummaryBar
        trip={trip}
        resultCount={loadState === "ready" ? filtered.length : 0}
        days={days}
        onModify={() => setModifyOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Compare rental offers
            </h1>
            <p className="mt-1 text-sm text-black/50 dark:text-white/50">
              Total prices in TND from Tunisian agencies ·{" "}
              {formatTripDate(trip.pickupDate)} – {formatTripDate(trip.dropoffDate)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-black/15 px-4 text-sm font-semibold transition hover:border-black/40 dark:border-white/15 dark:hover:border-white/40 lg:hidden"
            >
              <Filter className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-[4px] bg-black px-1.5 py-0.5 text-[10px] text-white dark:bg-white dark:text-black">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <label className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-black/15 px-3 text-sm dark:border-white/15">
              <SlidersHorizontal className="size-3.5 text-black/45 dark:text-white/45" />
              <span className="sr-only">Sort offers</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="appearance-none bg-transparent pr-6 font-semibold outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className={optionClassName}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none -ml-5 size-4 text-black/40 dark:text-white/40" />
            </label>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-[11.5rem] max-h-[calc(100vh-12.5rem)] overflow-y-auto rounded-[14px] border border-black/10 bg-black/[0.015] p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <FiltersPanel
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(defaultFilters())}
                resultCount={filtered.length}
              />
            </div>
          </aside>

          <section className="min-w-0 space-y-4" aria-live="polite">
            {loadState === "loading" || isPending ? (
              <>
                <OfferCardSkeleton />
                <OfferCardSkeleton />
                <OfferCardSkeleton />
              </>
            ) : loadState === "error" ? (
              <div className="rounded-[14px] border border-black/10 px-6 py-16 text-center dark:border-white/10">
                <RefreshCw className="mx-auto size-8 text-black/35 dark:text-white/35" />
                <h2 className="mt-4 text-xl font-semibold">Couldn’t load offers</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-black/50 dark:text-white/50">
                  Something went wrong while comparing agencies. Try again.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoadState("loading")
                    window.setTimeout(() => setLoadState("ready"), 700)
                  }}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-[8px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
                >
                  <RefreshCw className="size-4" />
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[14px] border border-black/10 px-6 py-16 text-center dark:border-white/10">
                <SearchX className="mx-auto size-8 text-black/35 dark:text-white/35" />
                <h2 className="mt-4 text-xl font-semibold">No cars for these dates</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-black/50 dark:text-white/50">
                  No matching offers for {trip.pickupLocation}. Try widening your
                  dates, clearing filters, or searching a nearby location.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={widenDates}
                    className="inline-flex h-11 items-center rounded-[8px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
                  >
                    Widen dates by 1 day
                  </button>
                  <button
                    type="button"
                    onClick={nearbyLocation}
                    className="inline-flex h-11 items-center rounded-[8px] border border-black/20 px-4 text-sm font-semibold dark:border-white/20"
                  >
                    Try Tunis Centre
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters(defaultFilters())}
                    className="inline-flex h-11 items-center rounded-[8px] border border-black/20 px-4 text-sm font-semibold dark:border-white/20"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            ) : (
              filtered.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  days={days}
                  tripQuery={searchParams.toString()}
                />
              ))
            )}
          </section>
        </div>
      </main>

      <Footer />

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88vh] overflow-y-auto rounded-t-[18px] border-black/10 bg-white p-0 dark:border-white/10 dark:bg-zinc-900"
        >
          <SheetHeader className="sticky top-0 z-10 border-b border-black/10 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-zinc-900/95">
            <SheetTitle className="text-left text-black dark:text-white">
              Filters
            </SheetTitle>
            <SheetDescription className="text-left text-black/50 dark:text-white/50">
              Narrow offers by price, specs, and agency terms.
            </SheetDescription>
          </SheetHeader>
          <div className="px-5 pb-8 pt-2">
            <FiltersPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(defaultFilters())}
              resultCount={filtered.length}
            />
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Show {filtered.length} offer{filtered.length === 1 ? "" : "s"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={modifyOpen} onOpenChange={setModifyOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto rounded-t-[18px] border-black/10 bg-white p-0 dark:border-white/10 dark:bg-zinc-900 sm:mx-auto sm:max-w-xl sm:rounded-[18px] sm:border"
        >
          <SheetHeader className="border-b border-black/10 px-5 py-4 dark:border-white/10">
            <SheetTitle className="text-left text-black dark:text-white">
              Modify search
            </SheetTitle>
            <SheetDescription className="text-left text-black/50 dark:text-white/50">
              Update location, dates, times, or driver age.
            </SheetDescription>
          </SheetHeader>

          <form
            className="space-y-4 px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault()
              applyTrip(draftTrip)
            }}
          >
            <label className="flex cursor-pointer items-center gap-3 text-sm text-black/70 dark:text-white/70">
              <input
                type="checkbox"
                checked={draftTrip.differentReturn}
                onChange={(event) =>
                  setDraftTrip((prev) => ({
                    ...prev,
                    differentReturn: event.target.checked,
                    dropoffLocation: event.target.checked
                      ? prev.dropoffLocation === prev.pickupLocation
                        ? "Monastir Airport"
                        : prev.dropoffLocation
                      : prev.pickupLocation,
                  }))
                }
                className="size-4 rounded border-black/25 accent-black dark:accent-white"
              />
              Return to a different location
            </label>

            <Field
              label="Pick-up location"
              icon={<MapPin className="size-3.5" />}
            >
              <select
                value={draftTrip.pickupLocation}
                onChange={(event) =>
                  setDraftTrip((prev) => ({
                    ...prev,
                    pickupLocation: event.target.value,
                    dropoffLocation: prev.differentReturn
                      ? prev.dropoffLocation
                      : event.target.value,
                  }))
                }
                className={controlClassName}
              >
                {LOCATIONS.map((location) => (
                  <option key={location} value={location} className={optionClassName}>
                    {location}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
            </Field>

            {draftTrip.differentReturn && (
              <Field
                label="Drop-off location"
                icon={<MapPin className="size-3.5" />}
              >
                <select
                  value={draftTrip.dropoffLocation}
                  onChange={(event) =>
                    setDraftTrip((prev) => ({
                      ...prev,
                      dropoffLocation: event.target.value,
                    }))
                  }
                  className={controlClassName}
                >
                  {LOCATIONS.map((location) => (
                    <option key={location} value={location} className={optionClassName}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pick-up date" icon={<CalendarDays className="size-3.5" />}>
                <input
                  type="date"
                  value={draftTrip.pickupDate}
                  min={toDateInput(new Date())}
                  onChange={(event) =>
                    setDraftTrip((prev) => ({
                      ...prev,
                      pickupDate: event.target.value,
                      dropoffDate:
                        event.target.value > prev.dropoffDate
                          ? event.target.value
                          : prev.dropoffDate,
                    }))
                  }
                  className={dateControlClassName}
                  required
                />
              </Field>
              <Field label="Pick-up time" icon={<Clock3 className="size-3.5" />}>
                <select
                  value={draftTrip.pickupTime}
                  onChange={(event) =>
                    setDraftTrip((prev) => ({
                      ...prev,
                      pickupTime: event.target.value,
                    }))
                  }
                  className={controlClassName}
                >
                  {TIMES.map((time) => (
                    <option key={time} value={time} className={optionClassName}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
              </Field>
              <Field label="Drop-off date" icon={<CalendarDays className="size-3.5" />}>
                <input
                  type="date"
                  value={draftTrip.dropoffDate}
                  min={draftTrip.pickupDate}
                  onChange={(event) =>
                    setDraftTrip((prev) => ({
                      ...prev,
                      dropoffDate: event.target.value,
                    }))
                  }
                  className={dateControlClassName}
                  required
                />
              </Field>
              <Field label="Drop-off time" icon={<Clock3 className="size-3.5" />}>
                <select
                  value={draftTrip.dropoffTime}
                  onChange={(event) =>
                    setDraftTrip((prev) => ({
                      ...prev,
                      dropoffTime: event.target.value,
                    }))
                  }
                  className={controlClassName}
                >
                  {TIMES.map((time) => (
                    <option key={time} value={time} className={optionClassName}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
              </Field>
            </div>

            <Field label="Driver age" icon={<UserRound className="size-3.5" />}>
              <select
                value={draftTrip.driverAge}
                onChange={(event) =>
                  setDraftTrip((prev) => ({
                    ...prev,
                    driverAge: event.target.value,
                  }))
                }
                className={controlClassName}
              >
                <option value="18-20" className={optionClassName}>
                  18–20
                </option>
                <option value="21-24" className={optionClassName}>
                  21–24
                </option>
                <option value="25-29" className={optionClassName}>
                  25–29
                </option>
                <option value="30" className={optionClassName}>
                  30+
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
            </Field>

            <p className="text-xs text-black/45 dark:text-white/45">
              Current age band: {driverAgeLabel(draftTrip.driverAge)} · prices stay in
              TND
            </p>

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Update results
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/55 dark:text-white/55">
        {icon}
        {label}
      </span>
      <span className="relative block">{children}</span>
    </label>
  )
}
