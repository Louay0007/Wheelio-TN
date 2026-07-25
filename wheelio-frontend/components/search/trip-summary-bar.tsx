"use client"

import type { ReactNode } from "react"
import {
  CalendarDays,
  Clock3,
  MapPin,
  PencilLine,
  UserRound,
} from "lucide-react"
import type { TripQuery } from "@/lib/search-types"
import { driverAgeLabel, formatTripDate } from "@/lib/search-utils"

type TripSummaryBarProps = {
  trip: TripQuery
  resultCount: number
  days: number
  onModify: () => void
}

function Chip({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-[10px] border border-black/10 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="text-black/45 dark:text-white/45">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-black dark:text-white">{value}</p>
      </div>
    </div>
  )
}

export function TripSummaryBar({
  trip,
  resultCount,
  days,
  onModify,
}: TripSummaryBarProps) {
  return (
    <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
            Your trip · {days} day{days === 1 ? "" : "s"} · {resultCount} offer
            {resultCount === 1 ? "" : "s"}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Chip
              icon={<MapPin className="size-3.5" />}
              label={trip.differentReturn ? "Pick-up" : "Location"}
              value={trip.pickupLocation}
            />
            {trip.differentReturn && (
              <Chip
                icon={<MapPin className="size-3.5" />}
                label="Drop-off"
                value={trip.dropoffLocation}
              />
            )}
            <Chip
              icon={<CalendarDays className="size-3.5" />}
              label="Dates"
              value={`${formatTripDate(trip.pickupDate)} → ${formatTripDate(trip.dropoffDate)}`}
            />
            <Chip
              icon={<Clock3 className="size-3.5" />}
              label="Times"
              value={`${trip.pickupTime} → ${trip.dropoffTime}`}
            />
            <Chip
              icon={<UserRound className="size-3.5" />}
              label="Driver age"
              value={driverAgeLabel(trip.driverAge)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onModify}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] border border-black/20 px-4 text-sm font-semibold text-black transition hover:border-black/50 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:border-white/20 dark:text-white dark:hover:border-white/50 dark:hover:bg-white/[0.04] dark:focus-visible:outline-white"
        >
          <PencilLine className="size-4" />
          Modify search
        </button>
      </div>
    </div>
  )
}
