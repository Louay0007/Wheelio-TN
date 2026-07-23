"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Star } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import {
  REVIEW_OVERALL,
  REVIEWS,
  initialsAvatar,
  listReviewLocations,
} from "@/lib/reviews-data"

export function ReviewsHubClient() {
  const locations = listReviewLocations()
  const [location, setLocation] = useState<string>("all")
  const [minRating, setMinRating] = useState<number>(0)

  const filtered = useMemo(() => {
    return REVIEWS.filter((r) => {
      if (location !== "all" && r.location !== location) return false
      if (r.rating < minRating) return false
      return true
    })
  }, [location, minRating])

  return (
    <PageShell>
      <PageHero
        eyebrow="Social proof"
        title="Customer reviews"
        description="Honest feedback from travellers who compared Tunisian agencies on Wheelio. Demo content for product preview."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-6 border-b border-black/10 pb-10 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              Overall
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-[-0.04em]">
                {REVIEW_OVERALL.score.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1 text-sm text-black/55 dark:text-white/55">
                <Star className="size-4 fill-current" />
                / 5 · {REVIEW_OVERALL.count} reviews
              </span>
            </div>
            <p className="mt-2 text-sm text-black/45 dark:text-white/45">
              {REVIEW_OVERALL.label}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-black/50 dark:text-white/50">
              Location
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-10 min-w-[140px] rounded-[7px] border border-black/15 bg-transparent px-3 text-sm text-black dark:border-white/15 dark:text-white"
              >
                <option value="all">All locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-black/50 dark:text-white/50">
              Min rating
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="h-10 min-w-[120px] rounded-[7px] border border-black/15 bg-transparent px-3 text-sm text-black dark:border-white/15 dark:text-white"
              >
                <option value={0}>Any</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
                <option value={5}>5 only</option>
              </select>
            </label>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-black/55 dark:text-white/55">
            No reviews match these filters.{" "}
            <button
              type="button"
              onClick={() => {
                setLocation("all")
                setMinRating(0)
              }}
              className="font-medium underline underline-offset-4"
            >
              Reset
            </button>
          </p>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((review) => (
              <li
                key={review.id}
                className="flex flex-col rounded-[8px] border border-black/10 p-5 dark:border-white/10"
              >
                <div className="flex items-start gap-3">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-800">
                    <Image
                      src={initialsAvatar(review.name)}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold tracking-[-0.02em]">{review.name}</p>
                    <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">
                      {review.tripContext} · {review.month}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm font-medium">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < review.rating
                          ? "fill-current"
                          : "text-black/15 dark:text-white/15"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-black/45 dark:text-white/45">
                    {review.location}
                  </span>
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-black/65 dark:text-white/65">
                  “{review.quote}”
                </blockquote>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-black/40 dark:text-white/40">
                  {review.agency}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 flex flex-wrap gap-3 border-t border-black/10 pt-10 dark:border-white/10">
          <Link
            href="/search"
            className="inline-flex h-11 items-center gap-2 rounded-[7px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Find a car
            <ArrowUpRight className="size-4" />
          </Link>
          <p className="flex items-center text-sm text-black/45 dark:text-white/45">
            Writing a review will be available after completed bookings.
          </p>
        </div>
      </section>
    </PageShell>
  )
}
