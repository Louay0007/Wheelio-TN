"use client"

import { useState } from "react"
import Link from "next/link"
import { BookingInlineToast } from "@/components/bookings/booking-inline-toast"
import type { BookingRecord } from "@/lib/bookings"
import type { OfferDetail } from "@/lib/offer-detail"
import { cn } from "@/lib/utils"

type ReturnGuideClientProps = {
  booking: BookingRecord
  offer: OfferDetail
}

const RETURN_CHECKS = [
  "Return at or before agreed time",
  "Fuel: full-to-full unless prepaid fuel was added",
  "Mileage within agreed limit",
  "Personal items removed from cabin and boot",
  "Keys and documents handed to desk staff",
]

export function ReturnGuideClient({ booking, offer }: ReturnGuideClientProps) {
  const [notes, setNotes] = useState("")
  const [returned, setReturned] = useState(false)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const toggle = (item: string) => {
    setChecks((prev) => ({ ...prev, [item]: !prev[item] }))
  }

  const markReturned = () => {
    setReturned(true)
    setToast("Return noted (demo) — agency will confirm on their system")
    window.setTimeout(() => setToast(null), 4000)
  }

  return (
    <>
      <section className="rounded-[12px] border border-black/10 px-5 py-6 dark:border-white/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
          Return
        </p>
        <p className="mt-2 text-xl font-semibold tracking-[-0.02em]">
          {booking.returnLabel}
        </p>
        <p className="mt-2 text-sm text-black/55 dark:text-white/55">
          {booking.dropoffLocation}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Before you hand back the keys</h2>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          {offer.fuelPolicy}
        </p>
        <ul className="mt-4 space-y-2">
          {RETURN_CHECKS.map((item) => (
            <li key={item}>
              <label
                className={cn("flex cursor-pointer items-start gap-3 rounded-[10px] border px-3 py-3 text-sm",
                  checks[item]
                    ? "border-black/25 bg-black/[0.04] dark:border-white/25"
                    : "border-black/10 dark:border-white/10",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4"
                  checked={!!checks[item]}
                  onChange={() => toggle(item)}
                />
                {item}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <label htmlFor="return-notes" className="text-sm font-semibold">
          Optional notes for the agency
        </label>
        <textarea
          id="return-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scuffs, delays, fuel station used…"
          className="mt-2 w-full rounded-[10px] border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </section>

      <section className="mt-8 rounded-[12px] border border-dashed border-black/20 px-4 py-4 dark:border-white/20">
        <p className="font-semibold">Deposit release</p>
        <p className="mt-2 text-sm leading-relaxed text-black/55 dark:text-white/55">
          After the agency inspects the car, they release the deposit hold on
          their terminal. Your bank may take several business days to show the
          credit — this is normal. Wheelio cannot speed up card issuer timing.
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={returned || booking.status === "completed"}
          onClick={markReturned}
          className="inline-flex h-11 items-center justify-center rounded-[8px] bg-black px-5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {returned || booking.status === "completed"
            ? "Return recorded"
            : "Mark returned (demo)"}
        </button>
        {returned || booking.status === "completed" ? (
          <Link
            href={`/bookings/${booking.id}/review`}
            className="inline-flex h-11 items-center justify-center rounded-[8px] border border-black/20 px-5 text-sm font-semibold dark:border-white/20"
          >
            Write a review
          </Link>
        ) : null}
      </div>

      <BookingInlineToast message={toast} />
    </>
  )
}
