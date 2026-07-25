import type { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  formatAgencyTnd,
  statusLabel,
  type AgencyBooking,
  type AgencyBookingStatus,
} from "@/lib/agency"

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400"
const valueClass = "mt-1 font-mono text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50"
const cardClass =
  "rounded-[10px] border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"

export function MoneyTriad({
  listed,
  net,
  commission,
  takeRate,
  className,
}: {
  listed: number
  net: number
  commission: number
  takeRate: number
  className?: string
}) {
  return (
    <div className={cn("grid gap-3 p-4 sm:grid-cols-3", cardClass, className)}>
      <div>
        <p className={labelClass}>Price for customer</p>
        <p className={valueClass}>{formatAgencyTnd(listed)}</p>
      </div>
      <div>
        <p className={labelClass}>You keep (net)</p>
        <p className={valueClass}>{formatAgencyTnd(net)}</p>
      </div>
      <div>
        <p className={labelClass}>Wheelio fee ({takeRate}%)</p>
        <p className={valueClass}>{formatAgencyTnd(commission)}</p>
      </div>
    </div>
  )
}

export function DepositCallout({ amount }: { amount: number }) {
  return (
    <p className="rounded-[8px] border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-200">
      Deposit at desk (given back later):{" "}
      <span className="font-mono font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
        {formatAgencyTnd(amount)}
      </span>
      . This is not part of Wheelio’s fee.
    </p>
  )
}

export function BookingStatusChip({ status }: { status: AgencyBookingStatus }) {
  return (
    <span className="inline-flex rounded-[6px] border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
      {statusLabel(status)}
    </span>
  )
}

export function ConfirmationBadge({
  confirmation,
}: {
  confirmation: "instant" | "request"
}) {
  return (
    <span
      className={cn("inline-flex rounded-[6px] px-2 py-0.5 text-[11px] font-semibold",
        confirmation === "instant"
          ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
          : "border border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100",
      )}
    >
      {confirmation === "instant" ? "Instant booking" : "Needs your OK"}
    </span>
  )
}

export function SlaCountdown({ expiresAt }: { expiresAt?: string }) {
  if (!expiresAt) return null
  const ms = new Date(expiresAt).getTime() - Date.now()
  const hours = Math.max(0, ms / 3600_000)
  const urgent = hours < 2
  const label =
    hours < 1
      ? `${Math.round(hours * 60)} min left`
      : `${hours.toFixed(1)} hours left`
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-semibold",
        urgent
          ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
          : "border border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100",
      )}
      title={new Date(expiresAt).toLocaleString()}
    >
      Reply in {label}
    </span>
  )
}

export function BookingSubnav({
  bookingId,
  active,
}: {
  bookingId: string
  active: string
}) {
  const items = [
    { id: "overview", href: `/agency/bookings/${bookingId}`, label: "Overview" },
    { id: "accept", href: `/agency/bookings/${bookingId}/accept`, label: "Accept" },
    { id: "prepare", href: `/agency/bookings/${bookingId}/prepare`, label: "Get ready" },
    { id: "handover", href: `/agency/bookings/${bookingId}/handover`, label: "Give car" },
    { id: "return", href: `/agency/bookings/${bookingId}/return`, label: "Take back" },
    { id: "messages", href: `/agency/bookings/${bookingId}/messages`, label: "Messages" },
    { id: "documents", href: `/agency/bookings/${bookingId}/documents`, label: "Papers" },
    { id: "finance", href: `/agency/bookings/${bookingId}/finance`, label: "Money" },
    { id: "issue", href: `/agency/bookings/${bookingId}/issue`, label: "Problem" },
  ]
  return (
    <nav
      className="-mx-1 mb-6 flex w-full gap-1 overflow-x-auto pb-1"
      aria-label="Booking tools"
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn("shrink-0 cursor-pointer rounded-[7px] px-3 py-2 text-sm font-medium transition",
            active === item.id
              ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
              : "text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export function AgencyEmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="w-full rounded-[12px] border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-600 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
        {body}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function bookingVehicleLabel(booking: AgencyBooking, plate?: string) {
  return plate ? `${booking.categoryLabel} · ${plate}` : booking.categoryLabel
}
