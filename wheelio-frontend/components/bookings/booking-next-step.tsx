import Link from "next/link"
import {
  nextStepForStatus,
  type BookingRecord,
} from "@/lib/bookings"
import { cn } from "@/lib/utils"

type BookingNextStepProps = {
  booking: BookingRecord
  className?: string
}

export function BookingNextStep({ booking, className }: BookingNextStepProps) {
  const step = nextStepForStatus(booking.status)
  const href = step.absoluteHref
    ? step.absoluteHref
    : step.hrefSuffix
      ? `/bookings/${booking.id}${step.hrefSuffix}`
      : `/bookings/${booking.id}`

  return (
    <div
      className={cn("flex flex-col gap-3 rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.03]",
        className,
      )}
    >
      <p className="text-sm leading-relaxed tracking-[-0.02em] text-black/65 dark:text-white/65">
        {step.label}
      </p>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center justify-center rounded-[8px] border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90"
      >
        {step.cta}
      </Link>
    </div>
  )
}
