"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import QRCode from "qrcode"
import { Printer } from "lucide-react"
import { BookingShell } from "@/components/bookings/booking-shell"
import { Button } from "@/components/ui/button"
import {
  bookingTripTotal,
  type BookingRecord,
} from "@/lib/bookings"
import type { OfferDetail } from "@/lib/offer-detail"
import { formatTnd } from "@/lib/search-utils"
import { cn } from "@/lib/utils"

type BookingVoucherClientProps = {
  booking: BookingRecord
  offer: OfferDetail
}

function voucherWatermark(status: BookingRecord["status"]): "CONFIRMED" | "PENDING" {
  return status === "confirmed" || status === "active" || status === "completed"
    ? "CONFIRMED"
    : "PENDING"
}

function VoucherCard({
  booking,
  offer,
  qrUrl,
}: {
  booking: BookingRecord
  offer: OfferDetail
  qrUrl: string | null
}) {
  const watermark = voucherWatermark(booking.status)
  const isPending = watermark === "PENDING"
  const total = bookingTripTotal(booking)

  return (
    <article
      className={cn("booking-voucher relative overflow-hidden rounded-[4px] border-2 border-black bg-white text-black",
        "dark:border-white dark:bg-zinc-950 dark:text-white",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span
          className={cn("rotate-[-18deg] select-none font-mono text-5xl font-bold uppercase tracking-[0.2em] sm:text-6xl",
            isPending ? "text-black/[0.06] dark:text-white/[0.06]" : "text-black/[0.05] dark:text-white/[0.05]",
          )}
        >
          {watermark}
        </span>
      </div>

      <header className="relative border-b-2 border-black px-5 py-5 dark:border-white sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/55 dark:text-white/55">
              Wheelio TN · Rental voucher
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">
              Booking reference
            </p>
            <p className="font-mono text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {booking.reference}
            </p>
          </div>
          <div className="relative size-11 shrink-0 overflow-hidden border border-black/25 dark:border-white/25">
            <Image
              src="/logos/wheelio-icon.png"
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
        </div>
      </header>

      <div className="relative grid gap-6 px-5 py-6 sm:grid-cols-[1fr_auto] sm:px-8">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              Vehicle
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">
              {offer.modelName}
              {offer.orSimilar ? " or similar" : ""}
            </p>
            <p className="text-sm text-black/60 dark:text-white/60">
              {offer.categoryLabel} · {offer.transmission}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              Agency
            </p>
            <p className="mt-1 font-medium">{offer.agency.name}</p>
            <p className="text-sm text-black/60 dark:text-white/60">
              {offer.agency.locationLabel}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
                Pickup
              </p>
              <p className="mt-1 text-sm font-semibold">{booking.pickupLabel}</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                {booking.pickupLocation}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
                Return
              </p>
              <p className="mt-1 text-sm font-semibold">{booking.returnLabel}</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                {booking.dropoffLocation}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              Main driver
            </p>
            <p className="mt-1 text-sm font-medium">{booking.driverName}</p>
            <p className="text-sm text-black/60 dark:text-white/60">
              Licence {booking.licenseCountry} · age {booking.driverAgeBand}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              Amounts
            </p>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-black/60 dark:text-white/60">Rental total</dt>
                <dd className="font-semibold tabular-nums">{formatTnd(total)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/60 dark:text-white/60">Paid / due now</dt>
                <dd className="font-semibold tabular-nums">
                  {formatTnd(booking.amountDueNowTnd)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 pt-2 dark:border-white/10">
                <dt className="text-black/60 dark:text-white/60">Deposit at pickup</dt>
                <dd className="font-semibold tabular-nums">
                  {formatTnd(booking.depositAtPickupTnd)}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              Bring to desk
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-black/70 dark:text-white/70">
              {offer.documents.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 self-start border border-black/15 p-3 dark:border-white/15">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR code for booking verification"
              width={140}
              height={140}
              className="size-[140px]"
            />
          ) : (
            <div
              className="size-[140px] animate-pulse bg-black/5 dark:bg-white/5"
              aria-hidden
            />
          )}
          <p className="max-w-[140px] text-center font-mono text-[10px] leading-tight text-black/50 dark:text-white/50">
            Scan at agency desk
          </p>
        </div>
      </div>

      <footer className="relative border-t-2 border-dashed border-black px-5 py-3 dark:border-white sm:px-8">
        <p className="text-[10px] uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
          Present this voucher with matching ID · Wheelio TN marketplace
        </p>
      </footer>
    </article>
  )
}

export function BookingVoucherClient({
  booking,
  offer,
}: BookingVoucherClientProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const isPending = voucherWatermark(booking.status) === "PENDING"

  useEffect(() => {
    let cancelled = false
    const verifyUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/bookings/${booking.id}`
        : `/bookings/${booking.id}`

    void QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: "H",
      color: { dark: "#111111", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQrUrl(url)
    })

    return () => {
      cancelled = true
    }
  }, [booking.id])

  return (
    <BookingShell
      booking={booking}
      offer={offer}
      headerEyebrow="Voucher"
      showNextStep={false}
      mainClassName="print:py-4"
    >
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
        {isPending ? (
          <p
            role="status"
            className="rounded-[8px] border border-black/15 px-3 py-2 text-sm text-black/70 dark:border-white/15 dark:text-white/70"
          >
            This voucher is provisional until the agency confirms your booking.
          </p>
        ) : (
          <p className="text-sm text-black/55 dark:text-white/55">
            Print or save — desk staff will scan the QR code.
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="rounded-[8px] border-black/15 dark:border-white/15"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          Print voucher
        </Button>
      </div>

      <VoucherCard booking={booking} offer={offer} qrUrl={qrUrl} />

      <p className="print:hidden mt-6 text-xs text-black/45 dark:text-white/45">
        Need changes?{" "}
        <Link
          href={`/bookings/${booking.id}`}
          className="font-medium underline underline-offset-4"
        >
          Manage booking
        </Link>
      </p>
    </BookingShell>
  )
}
