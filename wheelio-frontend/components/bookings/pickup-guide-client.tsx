"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  MapPin,
} from "lucide-react"
import { BookingInlineToast } from "@/components/bookings/booking-inline-toast"
import type { BookingRecord } from "@/lib/bookings"
import { pickupMethodHeading } from "@/lib/booking-payments"
import type { OfferDetail } from "@/lib/offer-detail"
import { cn } from "@/lib/utils"

type PickupGuideClientProps = {
  booking: BookingRecord
  offer: OfferDetail
}

const DEFAULT_CHECKLIST = [
  "Passport or national ID",
  "Driving licence (main driver)",
  "Credit card in driver name for deposit",
  "Booking reference or voucher",
  "Flight number shared with agency",
]

function storageKey(bookingId: string) {
  return `wheelio-pickup-${bookingId}`
}

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function PickupGuideClient({ booking, offer }: PickupGuideClientProps) {
  const items = offer.documents.length ? offer.documents : DEFAULT_CHECKLIST
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(booking.id))
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>)
    } catch {
      // ignore
    }
  }, [booking.id])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const pickupMs = new Date(booking.pickupAtIso).getTime()
  const countdown = useMemo(() => {
    const diff = pickupMs - now
    if (diff <= 0) {
      return booking.status === "active"
        ? "Pickup window · rental in progress"
        : "Pickup time has passed"
    }
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    if (days > 0) return `Pickup in ${days} day${days === 1 ? "" : "s"} · ${hours}h`
    if (hours > 0) return `Pickup in ${hours} hour${hours === 1 ? "" : "s"}`
    const mins = Math.floor(diff / 60_000)
    return `Pickup in ${mins} min`
  }, [booking.status, now, pickupMs])

  const warnTravel =
    booking.status === "requested" ||
    booking.status === "payment_pending" ||
    booking.status === "held"

  const address = offer.pickupAddress || offer.mapLabel

  const toggle = (item: string) => {
    setChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] }
      try {
        localStorage.setItem(storageKey(booking.id), JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setToast("Address copied")
      window.setTimeout(() => {
        setCopied(false)
        setToast(null)
      }, 2000)
    } catch {
      setToast("Could not copy")
    }
  }

  return (
    <>
      {warnTravel ? (
        <div className="mb-8 flex gap-3 rounded-[12px] border border-black/15 px-4 py-4 dark:border-white/15">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Wait for confirmation before travelling</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              This booking is not confirmed yet. Do not go to the desk until the
              agency accepts or you complete payment.
            </p>
          </div>
        </div>
      ) : null}

      <section className="rounded-[12px] border border-black/10 px-5 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
          Countdown
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          {countdown}
        </p>
        <p className="mt-2 text-sm text-black/55 dark:text-white/55">
          {booking.pickupLabel} · {booking.pickupLocation}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          {pickupMethodHeading(offer.pickupMethod)}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
          {offer.pickupMethodNote}
        </p>
        <ul className="mt-4 space-y-2">
          {offer.pickupInstructions.map((line) => (
            <li
              key={line}
              className="text-sm text-black/55 dark:text-white/55"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-[12px] border border-black/10 p-5">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{offer.mapLabel}</p>
            <p className="mt-1 text-sm text-black/50 dark:text-white/50">
              {offer.mapHint}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={mapsUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            <ExternalLink className="size-4" />
            Open in Maps
          </a>
          <button
            type="button"
            onClick={() => void copyAddress()}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-black/20 px-4 text-sm font-semibold dark:border-white/20"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copy address
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">What to bring</h2>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          Check items off on this device — saved locally only.
        </p>
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const on = checked[item]
            return (
              <li key={item}>
                <label
                  className={cn("flex cursor-pointer items-start gap-3 rounded-[10px] border px-3 py-3 text-sm transition-colors",
                    on
                      ? "border-black/25 bg-black/[0.04] dark:border-white/25 dark:bg-white/[0.06]"
                      : "border-black/10",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 rounded border-black/30 dark:border-white/30"
                    checked={!!on}
                    onChange={() => toggle(item)}
                  />
                  <span className={on ? "line-through opacity-60" : undefined}>
                    {item}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-8 pt-8">
        <h2 className="text-lg font-semibold">Late arrival</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/55 dark:text-white/55">
          {offer.noShowPolicy} Call the agency if your flight is delayed — desk
          hours: {offer.pickupHours}.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Agency contact</h2>
        <p className="mt-2 text-sm text-black/55 dark:text-white/55">
          {offer.agency.name} · {booking.contactPhone}
        </p>
        <a
          href={`https://wa.me/21600000000?text=${encodeURIComponent(`Pickup for ${booking.reference}`)}`}
          className="mt-3 inline-flex text-sm font-semibold underline"
        >
          Message on WhatsApp
        </a>
      </section>

      <Link
        href={`/bookings/${booking.id}/voucher`}
        className="mt-10 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black sm:w-auto sm:px-6"
      >
        Open voucher
      </Link>

      <BookingInlineToast message={toast} />
    </>
  )
}
