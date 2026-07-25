"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AddToCalendarMenu } from "@/components/bookings/add-to-calendar-menu"
import {
  canModifyBooking,
  type BookingRecord,
} from "@/lib/bookings"
import { daysBetweenInclusive, countdownParts } from "@/lib/trip-datetime"
import type { OfferDetail } from "@/lib/offer-detail"
import { cn } from "@/lib/utils"

type BookingScheduleClientProps = {
  booking: BookingRecord
  offer: OfferDetail
}

function countdownTarget(booking: BookingRecord): string {
  return booking.status === "active" ? booking.returnAtIso : booking.pickupAtIso
}

function countdownHeading(booking: BookingRecord): string {
  return booking.status === "active" ? "Return in" : "Pickup in"
}

type PlanItem = {
  id: string
  title: string
  detail: string
  done?: boolean
}

function buildDayPlan(booking: BookingRecord, offer: OfferDetail): PlanItem[] {
  const flightLine =
    booking.flightNumber && booking.landingTime
      ? `Flight ${booking.flightNumber} lands ${booking.landingTime} — allow time for baggage and desk.`
      : "Share your flight in manage booking if you land at the airport."

  return [
    {
      id: "t2",
      title: "T-2 · Documents",
      detail: `Pack ${offer.documents.slice(0, 2).join(", ") || "ID and licence"} plus this reference.`,
    },
    {
      id: "t1",
      title: "T-1 · Travel day",
      detail: flightLine,
    },
    {
      id: "pickup",
      title: "Pickup day",
      detail: `${booking.pickupLabel} · ${booking.pickupLocation}. ${offer.pickupHours}`,
      done: booking.status === "active" || booking.status === "completed",
    },
    {
      id: "return",
      title: "Return day",
      detail: `${booking.returnLabel} · ${booking.dropoffLocation}. Return with agreed fuel level.`,
      done: booking.status === "completed",
    },
  ]
}

function DateRangeStrip({
  pickupIso,
  returnIso,
}: {
  pickupIso: string
  returnIso: string
}) {
  const pickup = new Date(pickupIso)
  const returnDate = new Date(returnIso)
  const start = new Date(pickup)
  start.setDate(start.getDate() - 2)
  const end = new Date(returnDate)
  end.setDate(end.getDate() + 2)

  const pickupKey = pickup.toDateString()
  const returnKey = returnDate.toDateString()

  const days: { date: Date; inRange: boolean; isPickup: boolean; isReturn: boolean }[] =
    []
  const cursor = new Date(start)
  while (cursor <= end) {
    const d = new Date(cursor)
    const key = d.toDateString()
    const isPickup = key === pickupKey
    const isReturn = key === returnKey
    const inRange =
      isPickup ||
      isReturn ||
      (d.getTime() > pickup.getTime() && d.getTime() < returnDate.getTime())
    days.push({
      date: d,
      inRange,
      isPickup,
      isReturn,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1">
        {days.map((day) => {
          const label = day.date.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
          return (
            <div
              key={day.date.toISOString()}
              className={cn("flex w-14 flex-col items-center rounded-[6px] border px-1 py-2 text-center",
                day.inRange
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/10 bg-black/[0.02] text-black/45 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/45",
                day.isPickup && "ring-2 ring-black/30 dark:ring-white/30",
                day.isReturn && "ring-2 ring-black/30 dark:ring-white/30",
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {day.date.toLocaleDateString("en-GB", { weekday: "narrow" })}
              </span>
              <span className="mt-1 text-xs font-semibold tabular-nums">
                {day.date.getDate()}
              </span>
              <span className="mt-0.5 text-[9px] leading-tight opacity-80">
                {day.isPickup ? "Out" : day.isReturn ? "Back" : day.inRange ? "·" : ""}
              </span>
              <span className="sr-only">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LiveCountdown({ targetIso, heading }: { targetIso: string; heading: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const parts = countdownParts(targetIso, now)

  return (
    <div className="rounded-[10px] border border-black/15 bg-black/[0.02] px-5 py-6 dark:border-white/15 dark:bg-white/[0.03]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
        {heading}
      </p>
      {parts ? (
        <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          {parts.label}
        </p>
      ) : (
        <p className="mt-2 text-lg font-medium text-black/60 dark:text-white/60">
          Time passed — see manage booking for status.
        </p>
      )}
    </div>
  )
}

export function BookingScheduleClient({
  booking,
  offer,
}: BookingScheduleClientProps) {
  const target = countdownTarget(booking)
  const rentalDays = useMemo(
    () => daysBetweenInclusive(booking.pickupAtIso, booking.returnAtIso),
    [booking.pickupAtIso, booking.returnAtIso],
  )
  const plan = useMemo(() => buildDayPlan(booking, offer), [booking, offer])
  const modifiable = canModifyBooking(booking)

  return (
    <div className="space-y-10">
      <section aria-labelledby="schedule-times">
        <h2 id="schedule-times" className="sr-only">
          Pickup and return times
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              Pickup
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {booking.pickupLabel}
            </p>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {booking.pickupLocation}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              Return
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {booking.returnLabel}
            </p>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {booking.dropoffLocation}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-black/50 dark:text-white/50">
          {rentalDays} day{rentalDays === 1 ? "" : "s"} on the contract
        </p>
      </section>

      <LiveCountdown targetIso={target} heading={countdownHeading(booking)} />

      <section aria-labelledby="trip-calendar-strip">
        <h2
          id="trip-calendar-strip"
          className="text-sm font-semibold tracking-[-0.02em]"
        >
          Trip window
        </h2>
        <div className="mt-4">
          <DateRangeStrip
            pickupIso={booking.pickupAtIso}
            returnIso={booking.returnAtIso}
          />
        </div>
      </section>

      <section aria-labelledby="day-plan">
        <h2 id="day-plan" className="text-sm font-semibold tracking-[-0.02em]">
          Day plan
        </h2>
        <ul className="mt-4 space-y-3">
          {plan.map((item) => (
            <li
              key={item.id}
              className={cn("rounded-[8px] border px-4 py-3",
                item.done
                  ? "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
                  : "border-black/15 dark:border-white/15",
              )}
            >
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-black/60 dark:text-white/60">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <AddToCalendarMenu booking={booking} offer={offer} />
        <Link
          href={`/bookings/${booking.id}/pickup`}
          className="inline-flex h-10 items-center justify-center rounded-[8px] border border-black/15 px-4 text-sm font-semibold dark:border-white/15"
        >
          Pickup guide
        </Link>
        {modifiable ? (
          <Link
            href={`/bookings/${booking.id}/modify`}
            className="inline-flex h-10 items-center justify-center rounded-[8px] border border-black/15 px-4 text-sm font-semibold dark:border-white/15"
          >
            Change dates
          </Link>
        ) : null}
      </div>
    </div>
  )
}
