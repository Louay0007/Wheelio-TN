"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import type { BookingRecord, BookingStatus } from "@/lib/bookings"
import type { OfferDetail } from "@/lib/offer-detail"
import { cn } from "@/lib/utils"

type ThreadMessage = {
  id: string
  from: "agency" | "system" | "customer"
  body: string
  at: string
}

type MessagesClientProps = {
  booking: BookingRecord
  offer: OfferDetail
}

function seedMessages(
  booking: BookingRecord,
  offer: OfferDetail,
): ThreadMessage[] {
  const base: ThreadMessage[] = [
    {
      id: "sys-1",
      from: "system",
      body: `Booking ${booking.reference} created on Wheelio.`,
      at: booking.createdAt,
    },
  ]

  const push = (id: string, from: ThreadMessage["from"], body: string, status: BookingStatus) => {
    const event = booking.timeline.find((t) => t.status === status)
    if (event) {
      base.push({ id, from, body, at: event.at })
    }
  }

  if (booking.status === "requested") {
    push(
      "sys-req",
      "system",
      "Waiting for agency — you'll be notified when they respond.",
      "requested",
    )
    base.push({
      id: "agency-1",
      from: "agency",
      body: `Hello from ${offer.agency.name}. We received your request and will confirm during desk hours.`,
      at: booking.createdAt,
    })
  }

  if (
    ["held", "payment_pending", "confirmed", "active", "completed"].includes(
      booking.status,
    )
  ) {
    push(
      "sys-held",
      "system",
      booking.status === "payment_pending"
        ? "Online deposit required to confirm."
        : "Offer held while you complete checkout steps.",
      booking.status === "payment_pending" ? "payment_pending" : "held",
    )
  }

  if (["confirmed", "active", "completed"].includes(booking.status)) {
    push(
      "sys-conf",
      "system",
      "Agency accepted your booking.",
      "confirmed",
    )
    base.push({
      id: "agency-conf",
      from: "agency",
      body: "You're confirmed. Reply here with flight updates or extras questions.",
      at:
        booking.timeline.find((t) => t.status === "confirmed")?.at ??
        booking.createdAt,
    })
  }

  if (booking.status === "cancelled") {
    push(
      "sys-cancel",
      "system",
      "This booking was cancelled — thread is read-only.",
      "cancelled",
    )
  }

  return base.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  )
}

export function MessagesClient({ booking, offer }: MessagesClientProps) {
  const seeded = useMemo(
    () => seedMessages(booking, offer),
    [booking, offer],
  )
  const [messages, setMessages] = useState<ThreadMessage[]>(seeded)
  const [draft, setDraft] = useState("")

  const readOnly =
    booking.status === "cancelled" || booking.status === "completed"

  const send = () => {
    const text = draft.trim()
    if (!text || readOnly) return
    setMessages((prev) => [
      ...prev,
      {
        id: `cust-${Date.now()}`,
        from: "customer",
        body: text,
        at: new Date().toISOString(),
      },
    ])
    setDraft("")
  }

  return (
    <>
      <p className="text-sm text-black/55 dark:text-white/55">
        Messages with {offer.agency.name} and Wheelio system notices. For urgent
        desk issues on pickup day, call the agency on your voucher.
      </p>

      <div className="mt-6 flex max-h-[420px] flex-col gap-3 overflow-y-auto rounded-[12px] border border-black/10 p-4 dark:border-white/10">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("max-w-[85%] rounded-[12px] px-3 py-2 text-sm",
              msg.from === "customer"
                ? "ml-auto border border-black/15 bg-black text-white dark:border-white/15 dark:bg-white dark:text-black"
                : msg.from === "agency"
                  ? "border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.04]"
                  : "border border-dashed border-black/15 text-black/60 dark:border-white/15 dark:text-white/60",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              {msg.from === "customer"
                ? "You"
                : msg.from === "agency"
                  ? offer.agency.name
                  : "Wheelio"}
            </p>
            <p className="mt-1 leading-relaxed">{msg.body}</p>
            <p className="mt-1 text-[10px] opacity-50">
              {new Date(msg.at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={draft}
          disabled={readOnly}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              send()
            }
          }}
          placeholder={
            readOnly ? "Thread closed" : "Write a message to the agency…"
          }
          className="min-w-0 flex-1 rounded-[8px] border border-black/15 bg-transparent px-3 py-2 text-sm disabled:opacity-50 dark:border-white/15"
        />
        <button
          type="button"
          disabled={readOnly || !draft.trim()}
          onClick={send}
          className="inline-flex h-10 shrink-0 items-center rounded-[8px] bg-black px-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          Send
        </button>
      </div>

      <a
        href={`https://wa.me/21600000000?text=${encodeURIComponent(`Booking ${booking.reference}`)}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline"
      >
        <MessageCircle className="size-4" />
        Continue on WhatsApp
      </a>
      {readOnly ? (
        <p className="mt-4 text-xs text-black/45 dark:text-white/45">
          This thread is read-only.{" "}
          <Link href="/search" className="underline">
            Book again
          </Link>
        </p>
      ) : null}
    </>
  )
}
