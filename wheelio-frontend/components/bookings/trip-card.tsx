import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { BookingStatusChip } from "@/components/bookings/booking-status-chip"
import {
  bookingTripTotal,
  type BookingRecord,
} from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"
import { formatTnd } from "@/lib/search-utils"
import { cn } from "@/lib/utils"

type TripCardProps = {
  booking: BookingRecord
  className?: string
}

export function TripCard({ booking, className }: TripCardProps) {
  const offer = getOfferDetail(booking.offerId)
  if (!offer) return null

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className={cn("group flex gap-4 rounded-[8px] border border-black/10 p-4 transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/25",
        className,
      )}
    >
      <div className="relative hidden size-20 shrink-0 overflow-hidden rounded-[8px] border border-black/10 bg-black/[0.03] sm:block dark:border-white/10 dark:bg-white/[0.04]">
        <Image
          src={offer.image}
          alt=""
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold tracking-[-0.02em]">
            {booking.reference}
          </span>
          <BookingStatusChip status={booking.status} />
        </div>
        <p className="mt-1 text-sm font-medium tracking-[-0.02em] text-black dark:text-white">
          {offer.modelName}
          {offer.orSimilar ? " or similar" : ""}
        </p>
        <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
          {offer.agency.name}
        </p>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Pickup {booking.pickupLabel}
        </p>
        <p className="mt-1 text-xs text-black/45 dark:text-white/45">
          Return {booking.returnLabel}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch">
        <p className="text-sm font-semibold tabular-nums tracking-[-0.02em]">
          {formatTnd(bookingTripTotal(booking))}
        </p>
        <ChevronRight className="size-4 text-black/30 transition-transform group-hover:translate-x-0.5 dark:text-white/30" />
      </div>
    </Link>
  )
}
