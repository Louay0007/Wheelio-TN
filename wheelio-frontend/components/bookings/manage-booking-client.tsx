"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Check,
  MessageCircle,
  PencilLine,
} from "lucide-react"
import { ContractDownloads } from "@/components/checkout/contract-downloads"
import { PageShell } from "@/components/page-shell"
import {
  estimateRefund,
  getDemoBooking,
  statusLabel,
  type BookingStatus,
} from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"
import { formatTnd } from "@/lib/search-utils"
import { cn } from "@/lib/utils"

const FLOW: BookingStatus[] = [
  "requested",
  "held",
  "payment_pending",
  "confirmed",
  "active",
  "completed",
]

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
          <Link href="/account" className="mt-6 inline-flex text-sm font-semibold underline">
            Go to account
          </Link>
        </main>
      </PageShell>
    )
  }

  const canEdit = !["active", "completed", "cancelled"].includes(booking.status)
  const canCancel = !["cancelled", "completed", "active"].includes(booking.status)
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
    <PageShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              Manage booking
            </p>
            <h1 className="mt-2 font-mono text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {booking.reference}
            </h1>
            <p className="mt-2 text-sm text-black/55 dark:text-white/55">
              Status:{" "}
              <span className="font-semibold text-black dark:text-white">
                {statusLabel(booking.status)}
              </span>
            </p>
          </div>
          <Link
            href={`/bookings/${booking.id}/confirmation`}
            className="text-sm font-semibold underline-offset-2 hover:underline"
          >
            View confirmation
          </Link>
        </div>

        {booking.status === "requested" ? (
          <div className="mt-6 rounded-[12px] border border-black/15 px-4 py-4 dark:border-white/15">
            <p className="font-semibold">Waiting for the agency</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              {offer.agency.name} usually responds within{" "}
              {booking.agencyDeadlineHours ?? 6} hours during desk time. We’ll
              email you when they confirm or propose a change.
            </p>
          </div>
        ) : null}

        {/* Timeline */}
        <section className="mt-10 border-b border-black/10 pb-10 dark:border-white/10">
          <h2 className="text-lg font-semibold">Status timeline</h2>
          <ol className="mt-6 space-y-0">
            {FLOW.map((step, index) => {
              const done = booking.status === "cancelled" ? false : index <= reachedIndex
              const current =
                booking.status !== "cancelled" && index === reachedIndex
              const event = booking.timeline.find((t) => t.status === step)
              return (
                <li key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border text-[10px] font-bold",
                        done
                          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                          : "border-black/20 text-black/30 dark:border-white/20 dark:text-white/30",
                      )}
                    >
                      {done ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    {index < FLOW.length - 1 ? (
                      <span
                        className={cn(
                          "my-1 w-px flex-1 min-h-6",
                          index < reachedIndex
                            ? "bg-black dark:bg-white"
                            : "bg-black/15 dark:bg-white/15",
                        )}
                      />
                    ) : null}
                  </div>
                  <div className="pb-6">
                    <p
                      className={cn(
                        "text-sm font-medium",
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

        {/* Details */}
        <section className="border-b border-black/10 py-8 dark:border-white/10">
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
                {formatTnd(booking.rentalTotalTnd + booking.extrasTotalTnd)}
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
              <dt className="text-black/45 dark:text-white/45">Due now / paid</dt>
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
          <p className="mt-3 text-xs text-black/40 dark:text-white/40">
            Quote is locked for this reference (demo snapshot).
          </p>
        </section>

        {/* Editable */}
        <section className="border-b border-black/10 py-8 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Contact & flight</h2>
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

        {/* Docs & support */}
        <section className="border-b border-black/10 py-8 dark:border-white/10">
          <h2 className="text-lg font-semibold">Documents & support</h2>
          <ContractDownloads
            bookingId={booking.id}
            agencyConfirmed={booking.status === "confirmed"}
            className="mt-4"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/21600000000?text=${encodeURIComponent(`Booking ${booking.reference}`)}`}
              className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-black/20 px-4 text-sm font-semibold dark:border-white/20"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center rounded-[8px] border border-black/20 px-4 text-sm font-semibold dark:border-white/20"
            >
              Open support case
            </Link>
          </div>
          <p className="mt-3 text-xs text-black/40 dark:text-white/40">
            Agency contact is shared after confirmation. For changes before
            pickup, message Wheelio first.
          </p>
        </section>

        {/* Cancel */}
        {canCancel ? (
          <section className="py-8">
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
              className="mt-4 inline-flex h-11 items-center rounded-[8px] border border-black/30 px-4 text-sm font-semibold dark:border-white/30"
            >
              Cancel booking
            </button>
          </section>
        ) : booking.status === "cancelled" ? (
          <p className="py-8 text-sm text-black/55 dark:text-white/55">
            This booking is cancelled.
          </p>
        ) : null}
      </main>

      {cancelOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
        >
          <div className="w-full max-w-md rounded-[14px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
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
    </PageShell>
  )
}
