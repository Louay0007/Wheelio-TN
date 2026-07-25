import type { ReactNode } from "react"
import { BookingStatusChip } from "@/components/bookings/booking-status-chip"
import type { BookingRecord } from "@/lib/bookings"
import type { OfferDetail } from "@/lib/offer-detail"
import { cn } from "@/lib/utils"

type BookingHeaderProps = {
  booking: BookingRecord
  offer: OfferDetail
  eyebrow?: string
  children?: ReactNode
  className?: string
}

export function BookingHeader({
  booking,
  offer,
  eyebrow = "Manage booking",
  children,
  className,
}: BookingHeaderProps) {
  const carLine = `${offer.modelName}${offer.orSimilar ? " or similar" : ""} · ${offer.agency.name}`

  return (
    <header className={cn("pb-8", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              {eyebrow}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {booking.reference}
            </h1>
            <BookingStatusChip status={booking.status} />
          </div>
          <p className="mt-2 text-sm tracking-[-0.02em] text-black/70 dark:text-white/70">
            {carLine}
          </p>
          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            Pickup{" "}
            <span className="font-medium text-black dark:text-white">
              {booking.pickupLabel}
            </span>
            <span className="text-black/40 dark:text-white/40"> · </span>
            {booking.pickupLocation}
          </p>
        </div>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </header>
  )
}
