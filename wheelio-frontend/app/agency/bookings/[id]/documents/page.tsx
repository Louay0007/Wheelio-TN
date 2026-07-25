"use client"

import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import { BookingSubnav } from "@/components/agency/agency-ui"
import {
  AgencyLinkButton,
  AgencyPanel,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { cn } from "@/lib/utils"

const DOCS = [
  {
    title: "Customer booking PDF",
    hint: "What the traveller can download. Read-only here.",
  },
  {
    title: "Agency booking PDF",
    hint: "Your copy with net and fee. Read-only here.",
  },
  {
    title: "Desk rental papers",
    hint: "Physical Tunisian contract - keep at the desk.",
  },
  {
    title: "Deposit receipt",
    hint: "Issued at pickup. Not part of Wheelio fee.",
  },
]

export default function DocsPage() {
  const { id } = useParams<{ id: string }>()
  const { workspace, ready } = useAgencySession()
  const booking = workspace?.bookings.find((b) => b.id === id)

  if (!ready || !workspace) {
    return (
      <AgencyShell title="Papers">
        <div className="h-40 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      </AgencyShell>
    )
  }

  if (!booking) {
    return (
      <AgencyShell title="Booking not found">
        <AgencyLinkButton href="/agency/bookings" variant="secondary">
          Back to bookings
        </AgencyLinkButton>
      </AgencyShell>
    )
  }

  return (
    <AgencyShell
      title={`Papers · ${booking.reference}`}
      description="Marketplace PDFs plus what you print or sign at the desk."
    >
      <BookingSubnav bookingId={id} active="documents" />

      <div className="mt-4 w-full max-w-2xl space-y-3">
        <AgencyTip>
          Demo: downloads are placeholders. Live files will appear after go-live.
        </AgencyTip>
        {DOCS.map((d) => (
          <AgencyPanel key={d.title}>
            <p className="font-semibold text-zinc-950 dark:text-zinc-50">
              {d.title}
            </p>
            <p className={cn("mt-1 text-sm", agencyMuted)}>{d.hint}</p>
            <button
              type="button"
              className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-[8px] border border-zinc-300 px-3 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
            >
              Open (demo)
            </button>
          </AgencyPanel>
        ))}
      </div>
    </AgencyShell>
  )
}
