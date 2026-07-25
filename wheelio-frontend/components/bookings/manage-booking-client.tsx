"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  CalendarDays,
  Check,
  FileText,
  MessageCircle,
  PencilLine,
  Receipt,
  Ticket,
  Wrench,
} from "lucide-react"
import { AddToCalendarMenu } from "@/components/bookings/add-to-calendar-menu"
import { BookingShell } from "@/components/bookings/booking-shell"
import { ContractDownloads } from "@/components/checkout/contract-downloads"
import { PageShell } from "@/components/page-shell"
import {
  bookingTripTotal,
  canCancelBooking,
  canModifyBooking,
  estimateRefund,
  getDemoBooking,
  statusLabel,
  type BookingStatus,
} from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"
import { formatTnd } from "@/lib/search-utils"
import { countdownParts } from "@/lib/trip-datetime"
import { cn } from "@/lib/utils"

const FLOW: BookingStatus[] = [
  "requested",
  "held",
  "payment_pending",
  "confirmed",
  "active",
  "completed",
]

const TOOLS = [
  { href: "voucher", label: "Voucher", icon: Ticket },
  { href: "schedule", label: "Schedule", icon: CalendarDays },
  { href: "documents", label: "Documents", icon: FileText },
  { href: "payments", label: "Payments", icon: Receipt },
  { href: "messages", label: "Messages", icon: MessageCircle },
  { href: "modify", label: "Modify", icon: Wrench },
] as const

type ManageBookingClientProps = {
  bookingId: string
}

export function ManageBookingClient({ bookingId }: ManageBookingClientProps) {
  const initial = useMemo(() => getDemoBooking(bookingId), [bookingId])
  const [booking, setBooking] = useState(initial)
  const [phone, setPhone] = useState(initial?.contactPhone ?? "")
  const [flight, setFlight] = useState(initial?.flightNumber ?? "")
  const [editing, setEditing] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const offer = booking ? getOfferDetail(booking.offerId) : null

  if (!booking || !offer) {
    return (
      <PageShell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-2xl font-semibold">Booking not found</h1>
          <Link
            href="/trips"
            className="mt-6 inline-flex text-sm font-semibold underline"
          >
            Your trips
          </Link>
        </main>
      </PageShell>
    )
  }

  const canEdit = canModifyBooking(booking)
  const canCancel = canCancelBooking(booking)
  const refund = estimateRefund(
    booking,
    offer.cancellation === "free"
      ? "free"
      : offer.cancellation === "partial"
        ? "partial"
        : "non_refundable",
  )
  const reachedIndex = Math.max(
    0,
    FLOW.indexOf(
      booking.status === "cancelled" ? "requested" : booking.status,
    ),
  )
  const countdownTarget =
    booking.status === "active" ? booking.returnAtIso : booking.pickupAtIso
  const countdown = countdownParts(countdownTarget)

  const saveEdits = () => {
    setBooking((prev) =>
      prev
        ? { ...prev, contactPhone: phone, flightNumber: flight || undefined }
        : prev,
    )
    setEditing(false)
    setToast("Contact details updated")
    window.setTimeout(() => setToast(null), 2500)
  }

  const confirmCancel = () => {
    setBooking((prev) =>
      prev
        ? {
            ...prev,
            status: "cancelled",
            timeline: [
              ...prev.timeline,
              {
                status: "cancelled",
                label: "Cancelled by customer",
                at: new Date().toISOString(),
              },
            ],
          }
        : prev,
    )
    setCancelOpen(false)
    setToast(
      refund > 0
        ? `Cancellation recorded · estimated refund ${formatTnd(refund)}`
        : "Cancellation recorded · no refund on this rate",
    )
    window.setTimeout(() => setToast(null), 3500)
  }

  return (
    <BookingShell
      booking={booking}
      offer={offer}
      headerEyebrow="Manage booking"
      headerActions={
        <div className="flex flex-wrap gap-2">
          <AddToCalendarMenu booking={booking} offer={offer} />
          <Link
            href={`/bookings/${booking.id}/confirmation`}
            className="inline-flex h-10 items-center rounded-[8px] border border-black/15 px-3 text-sm font-semibold dark:border-white/15"
          >
            Confirmation
          </Link>
        </div>
      }
    >
      {/* Schedule strip */}
      <section className="grid gap-3 rounded-[12px] border border-black/15 p-4 dark:border-white/15 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            Pickup
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug">
            {booking.pickupLabel}
          </p>
          <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
            {booking.pickupLocation}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            Return
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug">
            {booking.returnLabel}
          </p>
          <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
            {booking.dropoffLocation}
          </p>
        </div>
        <div className="rounded-[8px] bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            {booking.status === "active" ? "Return in" : "Pickup in"}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {countdown
              ? `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
              : "—"}
          </p>
          <Link
            href={`/bookings/${booking.id}/schedule`}
            className="mt-1 inline-block text-xs font-semibold underline underline-offset-2"
          >
            Full schedule
          </Link>
        </div>
      </section>

      {/* Tools */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-[-0.02em]">Trip tools</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const blocked =
              tool.href === "modify" && !canModifyBooking(booking)
            return (
              <Link
                key={tool.href}
                href={
                  blocked
                    ? `#`
                    : `/bookings/${booking.id}/${tool.href}`
                }
                aria-disabled={blocked}
                onClick={(e) => {
                  if (blocked) e.preventDefault()
                }}
                className={cn("inline-flex h-11 items-center gap-2 rounded-[8px] border border-black/15 px-3 text-sm font-semibold transition active:scale-[0.98] dark:border-white/15",
                  blocked && "pointer-events-none opacity-40",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-70" />
                {tool.label}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-10 pb-10">
        <h2 className="text-lg font-semibold">Status timeline</h2>
        <ol className="mt-6 space-y-0">
          {FLOW.map((step, index) => {
            const done =
              booking.status === "cancelled" ? false : index <= reachedIndex
            const current =
              booking.status !== "cancelled" && index === reachedIndex
            const event = booking.timeline.find((t) => t.status === step)
            return (
              <li key={step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={cn("flex size-7 items-center justify-center rounded-full border text-[10px] font-bold",
                      done
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-black/20 text-black/30 dark:border-white/20 dark:text-white/30",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  {index < FLOW.length - 1 ? (
                    <span
                      className={cn("my-1 min-h-6 w-px flex-1",
                        index < reachedIndex
                          ? "bg-black dark:bg-white"
                          : "bg-black/15 dark:bg-white/15",
                      )}
                    />
                  ) : null}
                </div>
                <div className="pb-6">
                  <p
                    className={cn("text-sm font-medium",
                      current && "text-black dark:text-white",
                      !done && "text-black/40 dark:text-white/40",
                    )}
                  >
                    {statusLabel(step)}
                  </p>
                  {event ? (
                    <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">
                      {event.label} ·{" "}
                      {new Date(event.at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
          {booking.status === "cancelled" ? (
            <li className="flex gap-4">
              <span className="flex size-7 items-center justify-center rounded-full border border-black/40 text-[10px] font-bold dark:border-white/40">
                ×
              </span>
              <p className="text-sm font-medium">Cancelled</p>
            </li>
          ) : null}
        </ol>
      </section>

      {/* Vehicle + money */}
      <section className="py-8">
        <div className="flex gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-[8px]">
            <Image
              src={offer.image}
              alt=""
              fill
              sizes="64px"
              className="object-cover grayscale-[15%]"
            />
          </div>
          <div>
            <h2 className="font-semibold">
              {offer.modelName}
              {offer.orSimilar ? " or similar" : ""}
            </h2>
            <p className="text-sm text-black/55 dark:text-white/55">
              {offer.agency.name} · {offer.agency.locationLabel}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-black/45 dark:text-white/45">Trip total</dt>
            <dd className="font-semibold tabular-nums">
              {formatTnd(bookingTripTotal(booking))}
            </dd>
          </div>
          <div>
            <dt className="text-black/45 dark:text-white/45">
              Deposit at pickup
            </dt>
            <dd className="tabular-nums">
              {formatTnd(booking.depositAtPickupTnd)}
            </dd>
          </div>
          <div>
            <dt className="text-black/45 dark:text-white/45">Paid / due now</dt>
            <dd className="tabular-nums">
              {formatTnd(booking.amountDueNowTnd)}
            </dd>
          </div>
          <div>
            <dt className="text-black/45 dark:text-white/45">Payment mode</dt>
            <dd>
              {booking.paymentMode === "deposit_online"
                ? "Online deposit"
                : "Pay at agency"}
            </dd>
          </div>
        </dl>
        <Link
          href={`/bookings/${booking.id}/payments`}
          className="mt-3 inline-block text-sm font-semibold underline underline-offset-2"
        >
          Money timeline
        </Link>
      </section>

      {/* People */}
      <section className="py-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">People & flight</h2>
          {canEdit ? (
            <button
              type="button"
              onClick={() => (editing ? saveEdits() : setEditing(true))}
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              <PencilLine className="size-3.5" />
              {editing ? "Save" : "Edit"}
            </button>
          ) : null}
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-black/45 dark:text-white/45">Contact</dt>
            <dd className="font-medium">{booking.contactName}</dd>
            <dd className="text-black/55 dark:text-white/55">
              {booking.contactEmail}
            </dd>
          </div>
          <div>
            <dt className="text-black/45 dark:text-white/45">Main driver</dt>
            <dd className="font-medium">{booking.driverName}</dd>
            <dd className="text-black/55 dark:text-white/55">
              Licence {booking.licenseCountry}
            </dd>
          </div>
        </dl>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">
              Phone
            </label>
            {editing ? (
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-[8px] border border-black/15 bg-black/[0.03] px-3 text-sm dark:border-white/15 dark:bg-white/[0.05]"
              />
            ) : (
              <p className="mt-1.5 text-sm">{booking.contactPhone}</p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">
              Flight number
            </label>
            {editing ? (
              <input
                value={flight}
                onChange={(e) => setFlight(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-[8px] border border-black/15 bg-black/[0.03] px-3 text-sm dark:border-white/15 dark:bg-white/[0.05]"
              />
            ) : (
              <p className="mt-1.5 text-sm">
                {booking.flightNumber || "Not provided"}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-8">
        <h2 className="text-lg font-semibold">Vehicle & policies</h2>
        <ul className="mt-3 space-y-2 text-sm text-black/65 dark:text-white/65">
          <li>{offer.fuelPolicy}</li>
          <li>{offer.mileageNote}</li>
          <li>{offer.cancellationNote}</li>
        </ul>
        <div className="mt-4 rounded-[10px] border border-black/10 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            Agency
          </p>
          <p className="mt-1 font-semibold">{offer.agency.name}</p>
          <p className="text-sm text-black/55 dark:text-white/55">
            {offer.agency.locationLabel} · desk hours, not 24/7
          </p>
          <p className="mt-2 text-xs text-black/45 dark:text-white/45">
            {offer.pickupMethodNote}
          </p>
        </div>
      </section>

      {/* Docs */}
      <section className="py-8">
        <h2 className="text-lg font-semibold">Contracts</h2>
        <ContractDownloads
          bookingId={booking.id}
          agencyConfirmed={
            booking.status === "confirmed" ||
            booking.status === "active" ||
            booking.status === "completed"
          }
          className="mt-4"
        />
        <Link
          href={`/bookings/${booking.id}/documents`}
          className="mt-3 inline-block text-sm font-semibold underline underline-offset-2"
        >
          All documents
        </Link>
      </section>

      {/* Cancel */}
      {canCancel ? (
        <section className="py-2">
          <h2 className="text-lg font-semibold">Cancellation</h2>
          <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
            {offer.cancellationNote}. Estimated refund of amounts paid through
            Wheelio:{" "}
            <span className="font-semibold text-black dark:text-white">
              {formatTnd(refund)}
            </span>
            .
          </p>
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="mt-4 inline-flex h-11 items-center rounded-[8px] border border-black/30 px-4 text-sm font-semibold transition active:scale-[0.98] dark:border-white/30"
          >
            Cancel booking
          </button>
        </section>
      ) : booking.status === "cancelled" ? (
        <p className="py-2 text-sm text-black/55 dark:text-white/55">
          This booking is cancelled.{" "}
          <Link href="/search" className="font-semibold underline">
            Book again
          </Link>
        </p>
      ) : null}

      {cancelOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
        >
          <div className="w-full max-w-md rounded-[14px] border border-black/10 bg-white p-5 dark:bg-zinc-900">
            <h3 id="cancel-title" className="text-lg font-semibold">
              Cancel {booking.reference}?
            </h3>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Estimated refund: {formatTnd(refund)}. The agency may still charge
              local fees outside Wheelio if the car was already prepared.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={confirmCancel}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-[8px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
              >
                Confirm cancellation
              </button>
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-[8px] border border-black/20 text-sm font-semibold dark:border-white/20"
              >
                Keep booking
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[8px] border border-black/15 bg-black px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:border-white/20 dark:bg-white dark:text-black"
        >
          {toast}
        </div>
      ) : null}
    </BookingShell>
  )
}
