"use client"

import { useState } from "react"
import { BookingShell } from "@/components/bookings/booking-shell"
import { Button } from "@/components/ui/button"
import type { BookingRecord } from "@/lib/bookings"
import type { OfferDetail } from "@/lib/offer-detail"
import { cn } from "@/lib/utils"

const ISSUE_TYPES = [
  { id: "damage", label: "Vehicle damage dispute" },
  { id: "deposit", label: "Deposit or charge on card" },
  { id: "service", label: "Agency service issue" },
  { id: "billing", label: "Billing or extras on contract" },
  { id: "other", label: "Other post-rental issue" },
] as const

type ClaimClientProps = {
  booking: BookingRecord
  offer: OfferDetail
}

function makeTicketId(): string {
  const n = Math.floor(100000 + Math.random() * 900000)
  return `WTN-TKT-${n}`
}

export function ClaimClient({ booking, offer }: ClaimClientProps) {
  const [issueType, setIssueType] = useState<string>("")
  const [description, setDescription] = useState("")
  const [ticketId, setTicketId] = useState<string | null>(null)

  if (ticketId) {
    return (
      <BookingShell
        booking={booking}
        offer={offer}
        headerEyebrow="Report issue"
        showNextStep={false}
      >
        <div className="rounded-[8px] border border-black/10 px-4 py-8 dark:border-white/10">
          <p className="text-sm text-black/50 dark:text-white/50">Ticket reference</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-[-0.02em]">
            {ticketId}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-black/60 dark:text-white/60">
            We logged your report for desk-time follow-up (typically within one
            business day). Wheelio coordinates between you and the rental agency;
            deposit decisions remain with the agency unless your booking terms say
            otherwise.
          </p>
        </div>
      </BookingShell>
    )
  }

  const canSubmit = issueType.length > 0 && description.trim().length >= 20

  return (
    <BookingShell
      booking={booking}
      offer={offer}
      headerEyebrow="Report issue"
      showNextStep={false}
    >
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit) return
          setTicketId(makeTicketId())
        }}
      >
        <p className="rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-relaxed text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
          Wheelio TN is a marketplace intermediary — we help you reach{" "}
          {offer.agency.name}, but the agency may own refundable deposits, damage
          assessments, and on-the-ground inspections. Do not share card numbers here.
        </p>

        <label className="block space-y-2">
          <span className="text-sm font-medium tracking-[-0.02em]">Issue type</span>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="h-10 w-full rounded-[8px] border border-black/15 bg-transparent px-3 text-sm dark:border-white/15"
            required
          >
            <option value="">Select…</option>
            {ISSUE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium tracking-[-0.02em]">
            Booking reference
          </span>
          <input
            readOnly
            value={booking.reference}
            className="h-10 w-full rounded-[8px] border border-black/10 bg-black/[0.03] px-3 font-mono text-sm dark:border-white/10 dark:bg-white/[0.04]"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium tracking-[-0.02em]">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
            minLength={20}
            placeholder="What happened, when, and any photos or contract notes you already have…"
            className="w-full rounded-[8px] border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/15 dark:focus-visible:ring-white/20"
          />
          <p className="text-xs text-black/45 dark:text-white/45">
            Minimum 20 characters for demo submit.
          </p>
        </label>

        <Button
          type="submit"
          disabled={!canSubmit}
          className={cn("rounded-[8px] bg-black dark:bg-white dark:text-black")}
        >
          Submit report
        </Button>
      </form>
    </BookingShell>
  )
}
