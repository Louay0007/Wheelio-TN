"use client"

import Link from "next/link"
import { useState } from "react"
import {
  CalendarDays,
  FileText,
  MessageCircle,
  Receipt,
  Ticket,
  Wrench,
} from "lucide-react"
import { PageShell } from "@/components/page-shell"
import { BookingStatusChip } from "@/components/bookings/booking-status-chip"
import {
  useBookingDetail,
  useCancellationQuote,
  useCancelBooking,
} from "@/lib/query/bookings"

const TOOLS = [
  { href: "voucher", label: "Voucher", icon: Ticket },
  { href: "schedule", label: "Schedule", icon: CalendarDays },
  { href: "documents", label: "Documents", icon: FileText },
  { href: "payments", label: "Payments", icon: Receipt },
  { href: "messages", label: "Messages", icon: MessageCircle },
  { href: "modify", label: "Modify", icon: Wrench },
] as const

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function millimesToTnd(value: string | undefined) {
  if (!value) return null
  return new Intl.NumberFormat("en-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 3,
  }).format(Number(value) / 1000)
}

export function ManageBookingClient({ bookingId }: { bookingId: string }) {
  const bookingQuery = useBookingDetail(bookingId)
  const cancellationQuote = useCancellationQuote()
  const cancelBooking = useCancelBooking()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const booking = bookingQuery.data
  const canCancel = Boolean(
    booking && ["requested", "held", "payment_pending", "confirmed"].includes(booking.status),
  )

  const confirmCancellation = async () => {
    if (!booking) return
    try {
      const quote = await cancellationQuote.mutateAsync(booking.bookingId)
      await cancelBooking.mutateAsync({
        bookingId: booking.bookingId,
        cancellationQuoteId: quote.cancellationQuoteId,
        expectedVersion: booking.version,
      })
      setCancelOpen(false)
      setNotice("Booking cancelled. Your latest booking state has been refreshed.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to cancel this booking.")
    }
  }

  if (bookingQuery.isLoading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-sm text-black/55 dark:text-white/55">Loading booking…</p>
        </main>
      </PageShell>
    )
  }

  if (!booking) {
    return (
      <PageShell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-2xl font-semibold">Booking unavailable</h1>
          <p className="mt-2 text-sm text-black/55 dark:text-white/55">
            {bookingQuery.error instanceof Error
              ? bookingQuery.error.message
              : "Sign in or use a valid booking access link to continue."}
          </p>
          <Link href="/bookings/find" className="mt-6 inline-flex text-sm font-semibold underline">
            Find a booking
          </Link>
        </main>
      </PageShell>
    )
  }

  const vehicle = booking.vehicle
    ? `${booking.vehicle.make} ${booking.vehicle.model}${booking.vehicle.year ? ` · ${booking.vehicle.year}` : ""}`
    : "Vehicle details pending"
  const total = millimesToTnd(booking.pricing?.commissionableMillimes)
  const deposit = millimesToTnd(booking.deposit?.amountMillimes)

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-7 dark:border-white/10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">Manage booking</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold sm:text-3xl">{booking.reference}</h1>
              <BookingStatusChip status={booking.status as never} />
            </div>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">{vehicle}</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">{booking.agencyName ?? "Rental agency"}</p>
          </div>
          <Link href={`/bookings/${booking.bookingId}/confirmation`} className="inline-flex h-10 items-center rounded-[8px] border border-black/15 px-3 text-sm font-semibold dark:border-white/15">
            Confirmation
          </Link>
        </header>

        {notice ? <p role="status" className="mt-5 rounded-[8px] border border-black/15 px-4 py-3 text-sm dark:border-white/15">{notice}</p> : null}

        <section className="mt-7 grid gap-3 rounded-[12px] border border-black/15 p-4 dark:border-white/15 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">Pickup</p>
            <p className="mt-1 text-sm font-semibold">{formatDateTime(booking.pickupAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">Return</p>
            <p className="mt-1 text-sm font-semibold">{formatDateTime(booking.returnAt)}</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Trip tools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TOOLS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={`/bookings/${booking.bookingId}/${href}`} className="flex items-center gap-3 rounded-[10px] border border-black/15 px-4 py-3 text-sm font-semibold transition hover:border-black/35 dark:border-white/15 dark:hover:border-white/35">
                <Icon className="size-4" /> {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[12px] border border-black/10 p-5 dark:border-white/10">
          <h2 className="text-lg font-semibold">Payment summary</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-black/50 dark:text-white/50">Rental total</dt><dd className="mt-1 font-semibold">{total ?? "Awaiting pricing"}</dd></div>
            <div><dt className="text-black/50 dark:text-white/50">Security deposit</dt><dd className="mt-1 font-semibold">{deposit ?? "Not required"}</dd></div>
          </dl>
        </section>

        <section className="mt-8 rounded-[12px] border border-black/10 p-5 dark:border-white/10">
          <h2 className="text-lg font-semibold">Booking timeline</h2>
          <ol className="mt-4 space-y-3">
            {booking.timeline.map((event) => (
              <li key={`${event.occurredAt}-${event.toStatus}`} className="text-sm">
                <p className="font-medium">{event.toStatus.replaceAll("_", " ")}</p>
                <p className="text-black/50 dark:text-white/50">{formatDateTime(event.occurredAt)}</p>
              </li>
            ))}
          </ol>
        </section>

        {canCancel ? (
          <section className="mt-8 border-t border-black/10 pt-7 dark:border-white/10">
            <h2 className="text-lg font-semibold">Need to cancel?</h2>
            <p className="mt-2 text-sm text-black/55 dark:text-white/55">Cancellation is confirmed against the latest version of this booking.</p>
            <button type="button" onClick={() => setCancelOpen(true)} className="mt-4 inline-flex h-10 items-center rounded-[8px] border border-red-700/40 px-4 text-sm font-semibold text-red-700 dark:text-red-300">Cancel booking</button>
          </section>
        ) : null}

        {cancelOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-heading">
            <div className="w-full max-w-md rounded-[12px] bg-white p-6 text-black shadow-xl dark:bg-zinc-950 dark:text-white">
              <h2 id="cancel-heading" className="text-lg font-semibold">Cancel {booking.reference}?</h2>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">We will request a fresh cancellation quote before applying this change.</p>
              <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setCancelOpen(false)} className="h-10 rounded-[8px] px-4 text-sm font-semibold">Keep booking</button><button type="button" disabled={cancellationQuote.isPending || cancelBooking.isPending} onClick={() => void confirmCancellation()} className="h-10 rounded-[8px] bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{cancellationQuote.isPending || cancelBooking.isPending ? "Cancelling…" : "Confirm cancellation"}</button></div>
            </div>
          </div>
        ) : null}
      </main>
    </PageShell>
  )
}
