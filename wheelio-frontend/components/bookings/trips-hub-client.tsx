"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Search } from "lucide-react"
import { TripCard } from "@/components/bookings/trip-card"
import { BookingStatusChip } from "@/components/bookings/booking-status-chip"
import {
  filterTripsByFilter,
  listDemoTrips,
  sortTripsByPickupDesc,
  type TripFilter,
} from "@/lib/bookings"
import { fetchMyBookings } from "@/lib/gateways/checkout"
import { useApiCheckoutSlice } from "@/lib/gateways/flags"
import { cn } from "@/lib/utils"

const FILTERS: { id: TripFilter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
]

const EMPTY_COPY: Record<TripFilter, { title: string; body: string }> = {
  upcoming: {
    title: "No upcoming trips",
    body: "When you book a car, it will show here before pickup.",
  },
  active: {
    title: "No active rental",
    body: "Trips in progress appear here while you have the keys.",
  },
  past: {
    title: "No past trips yet",
    body: "Completed rentals will be listed here for your records.",
  },
  cancelled: {
    title: "No cancelled bookings",
    body: "Cancelled trips are kept here for reference.",
  },
  all: {
    title: "No trips yet",
    body: "Search Tunis and book your first rental — guest checkout works.",
  },
}

type ApiTrip = {
  bookingId: string
  reference: string
  status: string
  pickupAt: string
  returnAt: string
  agencyId: string
}

function filterApiTrips(trips: ApiTrip[], filter: TripFilter, now = new Date()) {
  switch (filter) {
    case "upcoming":
      return trips.filter(
        (b) =>
          !["cancelled", "completed", "rejected", "active"].includes(b.status) &&
          new Date(b.pickupAt) >= now,
      )
    case "active":
      return trips.filter((b) => b.status === "active")
    case "past":
      return trips.filter((b) => b.status === "completed")
    case "cancelled":
      return trips.filter(
        (b) => b.status === "cancelled" || b.status === "rejected",
      )
    case "all":
    default:
      return trips
  }
}

export function TripsHubClient() {
  const api = useApiCheckoutSlice()
  const [filter, setFilter] = useState<TripFilter>("upcoming")
  const [apiTrips, setApiTrips] = useState<ApiTrip[] | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiLoading, setApiLoading] = useState(api)

  useEffect(() => {
    if (!api) {
      setApiLoading(false)
      return
    }
    let cancelled = false
    fetchMyBookings()
      .then((rows) => {
        if (!cancelled) {
          setApiTrips(rows)
          setApiError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setApiTrips([])
          setApiError(
            err instanceof Error ? err.message : "Sign in to see your trips",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setApiLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  const demoTrips = useMemo(() => {
    const all = listDemoTrips()
    return sortTripsByPickupDesc(filterTripsByFilter(all, filter))
  }, [filter])

  const apiFiltered = useMemo(() => {
    return filterApiTrips(apiTrips ?? [], filter).sort(
      (a, b) => new Date(b.pickupAt).getTime() - new Date(a.pickupAt).getTime(),
    )
  }, [apiTrips, filter])

  const tripCount = api ? apiFiltered.length : demoTrips.length
  const empty = EMPTY_COPY[filter]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter trips"
      >
        {FILTERS.map((item) => {
          const selected = filter === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-[8px] px-3.5 py-2 text-sm font-medium tracking-[-0.02em] transition-colors",
                selected
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-black/15 text-black/60 hover:border-black/30 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white",
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-black/50 dark:text-white/50">
          {apiLoading
            ? "Loading…"
            : `${tripCount} trip${tripCount === 1 ? "" : "s"}`}
        </p>
        <Link
          href="/trips/calendar"
          className="inline-flex items-center gap-2 text-sm font-medium text-black/70 underline-offset-4 hover:underline dark:text-white/70"
        >
          <CalendarDays className="size-4" />
          Calendar view
        </Link>
      </div>

      {apiError ? (
        <p
          className="mt-4 text-sm text-black/55 dark:text-white/55"
          role="status"
        >
          {apiError}
        </p>
      ) : null}

      <div className="mt-6 rounded-[10px] border border-black/10 bg-black/[0.02] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-sm leading-relaxed text-black/65 dark:text-white/65">
          Browsing as guest?{" "}
          <Link
            href="/bookings/find"
            className="font-semibold text-black underline underline-offset-4 dark:text-white"
          >
            Find a booking
          </Link>{" "}
          with your reference and email — no account required.
        </p>
      </div>

      {tripCount > 0 ? (
        <ul className="mt-8 space-y-3" aria-label="Trip list">
          {api
            ? apiFiltered.map((booking) => (
                <li key={booking.bookingId}>
                  <Link
                    href={`/bookings/${booking.bookingId}`}
                    className="flex items-center justify-between gap-3 rounded-[8px] border border-black/10 p-4 transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {booking.reference}
                        </span>
                        <BookingStatusChip status={booking.status as never} />
                      </div>
                      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                        Pickup {new Date(booking.pickupAt).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-black/45 dark:text-white/45">
                        Return {new Date(booking.returnAt).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))
            : demoTrips.map((booking) => (
                <li key={booking.id}>
                  <TripCard booking={booking} />
                </li>
              ))}
        </ul>
      ) : (
        <div className="mt-10 rounded-[12px] border border-dashed border-black/20 px-6 py-12 text-center dark:border-white/20">
          <p className="text-lg font-semibold tracking-[-0.02em]">
            {empty.title}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-black/55 dark:text-white/55">
            {empty.body}
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            <Search className="size-4" />
            Find a car
          </Link>
        </div>
      )}
    </div>
  )
}
