import { Suspense } from "react"
import type { Metadata } from "next"
import { SearchResults } from "@/components/search/search-results"
import { OfferCardSkeleton } from "@/components/search/offer-card"
import { SiteHeader } from "@/components/search/site-header"

export const metadata: Metadata = {
  title: "Search results | Wheelio",
  description:
    "Compare total rental car prices from trusted Tunisian agencies. Filter by category, seats, deposit, cancellation, and more.",
}

function SearchFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <SiteHeader />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6">
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-80 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <OfferCardSkeleton />
        <OfferCardSkeleton />
        <OfferCardSkeleton />
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchResults />
    </Suspense>
  )
}
