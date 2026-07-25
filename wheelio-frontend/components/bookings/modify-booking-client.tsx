"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BookingInlineToast } from "@/components/bookings/booking-inline-toast"
import {
  bookingTripTotal,
  canModifyBooking,
  CHECKOUT_EXTRAS,
  type BookingExtraId,
  type BookingRecord,
} from "@/lib/bookings"
import type { OfferDetail } from "@/lib/offer-detail"
import { formatTnd } from "@/lib/search-utils"

type ModifyBookingClientProps = {
  booking: BookingRecord
  offer: OfferDetail
}

function isoToDateInput(iso: string) {
  return iso.slice(0, 10)
}

export function ModifyBookingClient({
  booking,
  offer,
}: ModifyBookingClientProps) {
  const allowed = canModifyBooking(booking)
  const [pickupDate, setPickupDate] = useState(isoToDateInput(booking.pickupAtIso))
  const [returnDate, setReturnDate] = useState(isoToDateInput(booking.returnAtIso))
  const [extras, setExtras] = useState<BookingExtraId[]>(booking.extras)
  const [extraDriver, setExtraDriver] = useState("")
  const [flight, setFlight] = useState(booking.flightNumber ?? "")
  const [toast, setToast] = useState<string | null>(null)

  const baseTotal = bookingTripTotal(booking)

  const delta = useMemo(() => {
    let d = 0
    const origPickup = isoToDateInput(booking.pickupAtIso)
    const origReturn = isoToDateInput(booking.returnAtIso)
    if (pickupDate !== origPickup) d += 50
    if (returnDate !== origReturn) {
      const dayDiff = Math.max(
        0,
        Math.round(
          (new Date(returnDate).getTime() - new Date(origReturn).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      )
      d += dayDiff * 50
    }
    for (const extra of CHECKOUT_EXTRAS) {
      const had = booking.extras.includes(extra.id)
      const has = extras.includes(extra.id)
      if (!had && has) d += extra.priceTnd
      if (had && !has) d -= Math.round(extra.priceTnd * 0.5)
    }
    return d
  }, [booking, pickupDate, returnDate, extras])

  const toggleExtra = (id: BookingExtraId) => {
    setExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const submit = () => {
    setToast("Change request sent — the agency will confirm by email (demo)")
    window.setTimeout(() => setToast(null), 3500)
  }

  if (!allowed) {
    return (
      <div className="rounded-[12px] border border-black/15 px-5 py-6 dark:border-white/15">
        <p className="text-lg font-semibold">Changes not available</p>
        <p className="mt-2 text-sm leading-relaxed text-black/55 dark:text-white/55">
          This booking is {booking.status.replace("_", " ")}. Date, extras, and
          driver changes must go through the agency desk or support.
        </p>
        <Link
          href={`/bookings/${booking.id}/messages`}
          className="mt-4 inline-flex text-sm font-semibold underline"
        >
          Open messages
        </Link>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-black/55 dark:text-white/55">
        Submit a change request for {offer.agency.name}. Price updates are
        estimates until the agency accepts.
      </p>

      <form
        className="mt-8 space-y-10"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <section>
          <h2 className="text-lg font-semibold">Dates</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pickup-date" className="text-sm font-medium">
                Pickup date
              </label>
              <input
                id="pickup-date"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
            <div>
              <label htmlFor="return-date" className="text-sm font-medium">
                Return date
              </label>
              <input
                id="return-date"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-black/45 dark:text-white/45">
            Shifting dates may change availability · demo +50 TND per adjusted
            day.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Extras</h2>
          <ul className="mt-4 space-y-2">
            {CHECKOUT_EXTRAS.map((extra) => (
              <li key={extra.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-black/10 px-3 py-3 text-sm dark:border-white/10">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4"
                    checked={extras.includes(extra.id)}
                    onChange={() => toggleExtra(extra.id)}
                  />
                  <span>
                    <span className="font-medium">{extra.label}</span>
                    <span className="block text-black/50 dark:text-white/50">
                      {extra.description} · {formatTnd(extra.priceTnd)}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Additional driver</h2>
          <input
            type="text"
            value={extraDriver}
            onChange={(e) => setExtraDriver(e.target.value)}
            placeholder="Full name as on licence"
            className="mt-3 w-full rounded-[8px] border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold">Flight</h2>
          <input
            type="text"
            value={flight}
            onChange={(e) => setFlight(e.target.value)}
            placeholder="e.g. TU614"
            className="mt-3 w-full rounded-[8px] border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          />
        </section>

        <div className="sticky bottom-4 rounded-[12px] border border-black/15 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-white/15 dark:bg-zinc-950/95">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            Summary (demo)
          </p>
          <p className="mt-2 text-sm">
            Current trip total{" "}
            <span className="font-semibold">{formatTnd(baseTotal)}</span>
          </p>
          <p className="mt-1 text-sm">
            Estimated change{" "}
            <span className="font-semibold">
              {delta >= 0 ? "+" : ""}
              {formatTnd(delta)}
            </span>
          </p>
          <p className="mt-1 text-xs text-black/45 dark:text-white/45">
            Deposit at pickup stays {formatTnd(booking.depositAtPickupTnd)} unless
            the agency notifies you.
          </p>
          <button
            type="submit"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Send change request
          </button>
        </div>
      </form>

      <BookingInlineToast message={toast} />
    </>
  )
}
