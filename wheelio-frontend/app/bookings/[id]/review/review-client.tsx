"use client"

import Link from "next/link"
import { useState } from "react"
import { Star } from "lucide-react"
import { BookingShell } from "@/components/bookings/booking-shell"
import { Button } from "@/components/ui/button"
import type { BookingRecord } from "@/lib/bookings"
import type { OfferDetail } from "@/lib/offer-detail"
import { cn } from "@/lib/utils"

type ReviewClientProps = {
  booking: BookingRecord
  offer: OfferDetail
}

type RatingKey = "overall" | "car" | "agency" | "value"

const RATING_LABELS: Record<RatingKey, string> = {
  overall: "Overall trip",
  car: "Car condition",
  agency: "Agency service",
  value: "Value for money",
}

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium tracking-[-0.02em]">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn("inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-[8px] border px-3 text-sm font-semibold transition-colors",
              value >= n
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : "border-black/15 bg-transparent text-black/60 hover:border-black/30 dark:border-white/15 dark:text-white/60 dark:hover:border-white/30",
            )}
            aria-pressed={value >= n}
          >
            <Star
              className={cn("size-3.5",
                value >= n ? "fill-current" : "fill-none",
              )}
            />
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewClient({ booking, offer }: ReviewClientProps) {
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    overall: 0,
    car: 0,
    agency: 0,
    value: 0,
  })
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const completed = booking.status === "completed"

  if (!completed) {
    return (
      <BookingShell
        booking={booking}
        offer={offer}
        headerEyebrow="Review"
        showNextStep={false}
      >
        <div className="rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-lg font-semibold tracking-[-0.02em]">
            Available after return
          </p>
          <p className="mt-2 text-sm text-black/55 dark:text-white/55">
            Reviews open once the agency marks your rental complete. You can still
            open your trip overview or calendar in the meantime.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-[8px] bg-black dark:bg-white dark:text-black">
              <Link href={`/bookings/${booking.id}`}>Trip overview</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-[8px]">
              <Link href="/trips/calendar">Trip calendar</Link>
            </Button>
          </div>
        </div>
      </BookingShell>
    )
  }

  if (submitted) {
    return (
      <BookingShell
        booking={booking}
        offer={offer}
        headerEyebrow="Review"
        showNextStep={false}
      >
        <div className="rounded-[8px] border border-black/10 px-4 py-10 text-center dark:border-white/10">
          <p className="text-2xl font-semibold tracking-[-0.03em]">Thank you</p>
          <p className="mt-3 text-sm text-black/55 dark:text-white/55">
            Your feedback helps other travellers compare agencies fairly. Demo
            submissions are not published live yet.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-[8px] bg-black dark:bg-white dark:text-black">
              <Link href="/reviews">Browse reviews</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-[8px]">
              <Link href="/search">Find your next car</Link>
            </Button>
          </div>
        </div>
      </BookingShell>
    )
  }

  const canSubmit =
    ratings.overall > 0 &&
    ratings.car > 0 &&
    ratings.agency > 0 &&
    ratings.value > 0

  return (
    <BookingShell
      booking={booking}
      offer={offer}
      headerEyebrow="Review"
      showNextStep={false}
    >
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit) return
          setSubmitted(true)
        }}
      >
        <p className="text-sm text-black/55 dark:text-white/55">
          Rate your experience with {offer.agency.name} and the{" "}
          {offer.modelName}
          {offer.orSimilar ? " or similar" : ""} you collected.
        </p>

        {(Object.keys(RATING_LABELS) as RatingKey[]).map((key) => (
          <StarRow
            key={key}
            label={RATING_LABELS[key]}
            value={ratings[key]}
            onChange={(n) => setRatings((prev) => ({ ...prev, [key]: n }))}
          />
        ))}

        <label className="block space-y-2">
          <span className="text-sm font-medium tracking-[-0.02em]">
            Comments (optional)
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            placeholder="Pickup wait time, car cleanliness, deposit handling…"
            className="w-full rounded-[8px] border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/15 dark:focus-visible:ring-white/20"
          />
        </label>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="rounded-[8px] bg-black dark:bg-white dark:text-black"
        >
          Submit review
        </Button>
      </form>
    </BookingShell>
  )
}
