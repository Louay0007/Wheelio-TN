"use client"

import Link from "next/link"
import { AccountShell } from "@/components/account/account-shell"
import {
  ApiErrorState,
  ApiLoadingState,
} from "@/components/api/api-state"
import { Button } from "@/components/ui/button"
import { ApiClientError } from "@/lib/api/client"
import {
  useAccountMutations,
  useSavedOffers,
  useSavedSearches,
} from "@/lib/query/account"

function searchHref(snapshot: Record<string, unknown>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(snapshot)) {
    if (typeof value === "string" || typeof value === "number") {
      params.set(key, String(value))
    } else if (typeof value === "boolean") {
      params.set(key, value ? "1" : "0")
    }
  }
  return `/search${params.size ? `?${params.toString()}` : ""}`
}

export default function SavedPage() {
  const searches = useSavedSearches()
  const offers = useSavedOffers()
  const mutations = useAccountMutations()
  const authError = [searches.error, offers.error].find(
    (error) => error instanceof ApiClientError && error.status === 401,
  )

  if (searches.isPending || offers.isPending) {
    return <ApiLoadingState label="Loading saved items…" />
  }
  if (authError) {
    return (
      <AccountShell title="Saved" description="Saved searches and cars you are comparing.">
        <p className="text-sm text-black/55 dark:text-white/55">
          <Link
            href="/login?next=%2Faccount%2Fsaved"
            className="font-medium underline underline-offset-4"
          >
            Log in
          </Link>{" "}
          to keep saved searches and offers in your account.
        </p>
      </AccountShell>
    )
  }
  if (searches.isError) {
    return <ApiErrorState error={searches.error} retry={() => searches.refetch()} />
  }
  if (offers.isError) {
    return <ApiErrorState error={offers.error} retry={() => offers.refetch()} />
  }

  const empty = searches.data.length === 0 && offers.data.length === 0

  if (empty) {
    return (
      <AccountShell title="Saved" description="Saved searches and cars you are comparing.">
        <div className="rounded-[8px] border border-black/10 px-4 py-10 text-center dark:border-white/10">
          <p className="text-sm text-black/55 dark:text-white/55">
            Nothing saved yet. Compare cars on search and save your favourites here.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-[7px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Search again
          </Link>
        </div>
      </AccountShell>
    )
  }

  return (
    <AccountShell title="Saved" description="Saved searches and cars you are comparing.">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Saved searches</h2>
        {searches.data.length === 0 ? (
          <p className="text-sm text-black/55 dark:text-white/55">No saved searches.</p>
        ) : (
          <ul className="space-y-2">
            {searches.data.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-black/10 p-4 dark:border-white/10"
              >
                <Link href={searchHref(s.querySnapshot)} className="font-medium underline-offset-4 hover:underline">
                  {s.label || "Saved search"}
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[8px] border-black/15 text-xs dark:border-white/15"
                  disabled={mutations.deleteSavedSearch.isPending}
                  onClick={() => mutations.deleteSavedSearch.mutate(s.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 space-y-4 pt-8 dark:border-white/10">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Saved offers</h2>
        {offers.data.length === 0 ? (
          <p className="text-sm text-black/55 dark:text-white/55">
            No saved offers.{" "}
            <Link href="/search" className="font-medium underline underline-offset-4">
              Search again
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {offers.data.map((offer) => (
              <li
                key={offer.id}
                className="rounded-[8px] border border-black/10 p-4 dark:border-white/10"
              >
                <div className="min-w-0">
                  <Link
                    href={`/cars/${offer.offerId}`}
                    className="font-semibold tracking-[-0.02em] underline-offset-4 hover:underline"
                  >
                    {typeof offer.offerSnapshot.modelName === "string"
                      ? offer.offerSnapshot.modelName
                      : `Offer ${offer.offerId}`}
                  </Link>
                  <p className="text-sm text-black/55 dark:text-white/55">
                    Saved {new Date(offer.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/cars/${offer.offerId}`}
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      View offer
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-[8px] border-black/15 text-xs dark:border-white/15"
                      disabled={mutations.deleteSavedOffer.isPending}
                      onClick={() => mutations.deleteSavedOffer.mutate(offer.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8">
        <Link href="/search" className="text-sm font-medium underline underline-offset-4">
          Search again
        </Link>
      </p>
    </AccountShell>
  )
}
