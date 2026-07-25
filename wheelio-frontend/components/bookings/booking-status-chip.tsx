import { cn } from "@/lib/utils"
import { statusLabel, type BookingStatus } from "@/lib/bookings"

type BookingStatusChipProps = {
  status: BookingStatus
  className?: string
}

export function BookingStatusChip({ status, className }: BookingStatusChipProps) {
  const tone =
    status === "cancelled"
      ? "border-black/20 bg-black/[0.04] text-black/55 dark:border-white/20 dark:bg-white/[0.06] dark:text-white/55"
      : status === "completed"
        ? "border-black/15 bg-black/[0.03] text-black/60 dark:border-white/15 dark:bg-white/[0.05] dark:text-white/60"
        : status === "active"
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : status === "payment_pending" || status === "requested"
            ? "border-black/25 bg-transparent text-black dark:border-white/30 dark:text-white"
            : "border-black/20 bg-white text-black dark:border-white/25 dark:bg-zinc-900 dark:text-white"

  return (
    <span
      className={cn("inline-flex items-center rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
        tone,
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  )
}
