"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock3, Shield } from "lucide-react"
import type { OfferDetail } from "@/lib/offer-detail"
import { formatTnd } from "@/lib/search-utils"
import { cn } from "@/lib/utils"

type BookingRailProps = {
  offer: OfferDetail
  days: number
  variant: "desktop" | "mobile"
  checkoutHref: string
}

function useHoldCountdown(minutes: number) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60)

  useEffect(() => {
    setSecondsLeft(minutes * 60)
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [minutes])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0")
  const ss = String(secondsLeft % 60).padStart(2, "0")
  return { label: `${mm}:${ss}`, expired: secondsLeft === 0 }
}

export function BookingRail({
  offer,
  days,
  variant,
  checkoutHref,
}: BookingRailProps) {
  const perDay = Math.round(offer.totalPriceTnd / days)
  const hold = useHoldCountdown(offer.holdMinutes)
  const ctaLabel =
    offer.confirmation === "instant" ? "Continue" : "Request to book"

  if (variant === "mobile") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/95 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
              Total · {days}d
            </p>
            <p className="truncate text-xl font-semibold tracking-[-0.03em] tabular-nums">
              {formatTnd(offer.totalPriceTnd)}
            </p>
            <p className="truncate text-[11px] text-black/45 dark:text-white/45">
              Deposit {formatTnd(offer.depositTnd)} separate
              {!hold.expired && ` · Held ${hold.label}`}
            </p>
          </div>
          <Link
            href={hold.expired ? "#" : checkoutHref}
            aria-disabled={hold.expired}
            className={cn(
              "inline-flex h-12 shrink-0 items-center justify-center rounded-[8px] px-5 text-sm font-semibold",
              hold.expired
                ? "pointer-events-none bg-black/20 text-black/40 dark:bg-white/15 dark:text-white/40"
                : "bg-black text-white dark:bg-white dark:text-black",
            )}
            onClick={(event) => {
              if (hold.expired) event.preventDefault()
            }}
          >
            {hold.expired ? "Hold ended" : ctaLabel}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 overflow-hidden rounded-[14px] border border-black/15 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:border-white/15 dark:bg-zinc-950 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        {/* Receipt header — signature of this page */}
        <div className="border-b border-dashed border-black/15 bg-black/[0.02] px-5 py-4 dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
            Wheelio quote · TND
          </p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/40 dark:text-white/40">
                Total mandatory
              </p>
              <p className="mt-1 text-4xl font-semibold tracking-[-0.05em] tabular-nums text-black dark:text-white">
                {formatTnd(offer.totalPriceTnd)}
              </p>
              <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                {formatTnd(perDay)} / day · {days} day{days === 1 ? "" : "s"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold",
                offer.confirmation === "instant"
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/20 text-black dark:border-white/20 dark:text-white",
              )}
            >
              {offer.confirmation === "instant" ? "Instant" : "Request"}
            </span>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-start gap-2.5 text-sm">
            <Shield className="mt-0.5 size-4 shrink-0 text-black/40 dark:text-white/40" />
            <div>
              <p className="font-medium text-black dark:text-white">
                Refundable deposit
              </p>
              <p className="mt-0.5 text-black/55 dark:text-white/55">
                From {formatTnd(offer.depositTnd)} held at pickup — not part of
                the total above.
              </p>
            </div>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 rounded-[8px] border px-3 py-2.5 text-sm",
              hold.expired
                ? "border-black/20 bg-black/[0.03] text-black/50 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/50"
                : "border-black/15 text-black dark:border-white/15 dark:text-white",
            )}
          >
            <Clock3 className="size-4 shrink-0 opacity-50" />
            {hold.expired ? (
              <span>Price hold ended — refresh to check availability.</span>
            ) : (
              <span>
                Price held for{" "}
                <span className="font-semibold tabular-nums">{hold.label}</span>
              </span>
            )}
          </div>

          <Link
            href={hold.expired ? "#" : checkoutHref}
            aria-disabled={hold.expired}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center rounded-[8px] text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white",
              hold.expired
                ? "pointer-events-none bg-black/15 text-black/40 dark:bg-white/10 dark:text-white/40"
                : "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
            )}
            onClick={(event) => {
              if (hold.expired) event.preventDefault()
            }}
          >
            {hold.expired ? "Hold ended — go back to search" : ctaLabel}
          </Link>

          <p className="text-center text-[11px] leading-relaxed text-black/40 dark:text-white/40">
            {offer.confirmation === "instant"
              ? "You’ll confirm details next. No hidden fees in this total."
              : "The agency confirms after you submit. Total stays as shown if accepted."}
          </p>
        </div>
      </div>
    </aside>
  )
}
