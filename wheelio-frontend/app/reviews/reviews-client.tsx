"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Star } from "lucide-react"
import { ApiEmptyState, ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import { PageHero, PageShell } from "@/components/page-shell"
import type { AppLocaleDto } from "@/lib/contracts/common"
import type { PublicLocation, PublicReview } from "@/lib/contracts/public-catalog"
import { usePublicLocations, usePublicReviews } from "@/lib/query/public-catalog"

export function ReviewsHubClient({
  locale,
  initialReviews,
  initialLocations,
}: {
  locale: AppLocaleDto
  initialReviews: PublicReview[]
  initialLocations: PublicLocation[]
}) {
  const [location, setLocation] = useState<string>("all")
  const [minRating, setMinRating] = useState<number>(0)
  const filters = {
    ...(location === "all" ? {} : { locationId: location }),
    ...(minRating === 0 ? {} : { minRating }),
  }
  const hasFilters = location !== "all" || minRating !== 0
  const reviews = usePublicReviews(
    locale,
    hasFilters ? filters : undefined,
    hasFilters ? undefined : initialReviews,
  )
  const locations = usePublicLocations(locale, initialLocations)
  const average =
    reviews.data && reviews.data.length > 0
      ? reviews.data.reduce((sum, review) => sum + review.rating, 0) /
        reviews.data.length
      : 0

  return (
    <PageShell>
      <PageHero
        eyebrow="Social proof"
        title="Customer reviews"
        description="Honest feedback from travellers who booked Tunisian agencies on Wheelio."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-6 pb-10 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              Overall
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-[-0.04em]">
                {average.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1 text-sm text-black/55 dark:text-white/55">
                <Star className="size-4 fill-current" />
                / 5 · {reviews.data?.length ?? 0} reviews
              </span>
            </div>
            <p className="mt-2 text-sm text-black/45 dark:text-white/45">
              Verified reviews from completed bookings
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
                {locations.data?.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
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

        {reviews.isPending ? (
          <ApiLoadingState label="Loading reviews…" />
        ) : reviews.isError ? (
          <ApiErrorState error={reviews.error} retry={() => reviews.refetch()} />
        ) : reviews.data.length === 0 ? (
          <div className="mt-10">
            <ApiEmptyState
              title="No reviews match these filters"
              description="Try a different location or rating."
            />
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.data.map((review) => (
              <li
                key={review.id}
                className="flex flex-col rounded-[8px] border border-black/10 p-5 dark:border-white/10"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-zinc-100 text-sm font-semibold dark:border-white/10 dark:bg-zinc-800">
                    {review.authorDisplayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold tracking-[-0.02em]">
                      {review.authorDisplayName}
                    </p>
                    <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">
                      {new Intl.DateTimeFormat(locale, {
                        month: "long",
                        year: "numeric",
                      }).format(new Date(review.submittedAt))}
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
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-black/65 dark:text-white/65">
                  “{review.body}”
                </blockquote>
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-black/40 dark:text-white/40">
                  {review.agencyName}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 flex flex-wrap gap-3 pt-10 dark:border-white/10">
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
