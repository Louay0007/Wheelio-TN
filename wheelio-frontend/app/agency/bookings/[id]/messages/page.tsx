"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { BookingSubnav } from "@/components/agency/agency-ui"
import {
  AgencyInput,
  AgencyLinkButton,
  AgencyPanel,
  AgencyPrimaryButton,
  AgencyTip,
  agencyMuted,
  agencyMutedSoft,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { cn } from "@/lib/utils"

const TEMPLATES = [
  "Meet at T1 desk - look for our Wheelio sign.",
  "Running about 20 minutes late. We are still holding your car.",
  "Please bring your licence photo before pickup.",
]

export default function MessagesPage() {
  const { id } = useParams<{ id: string }>()
  const { workspace, session, ready } = useAgencySession()
  const booking = workspace?.bookings.find((b) => b.id === id)
  const [text, setText] = useState("")
  const [thread, setThread] = useState([
    { who: "Customer", body: "Where exactly is the desk?", at: "10:12" },
    {
      who: "Agency",
      body: "Terminal 1 arrivals - look for Carthage Drive.",
      at: "10:18",
    },
  ])

  if (!ready || !workspace) {
    return (
      <AgencyShell title="Messages">
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
      title={`Messages · ${booking.reference}`}
      description={`${booking.customerName} · desk hours only, not 24/7.`}
    >
      <BookingSubnav bookingId={id} active="messages" />

      <div className="mt-4 w-full max-w-2xl space-y-4">
        <AgencyTip>
          Keep replies short and concrete: where to meet, what to bring, delays.
        </AgencyTip>

        <AgencyPanel title="Thread">
          <div className="space-y-3">
            {thread.map((m, i) => (
              <div
                key={`${m.at}-${i}`}
                className={cn("rounded-[10px] border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700",
                  m.who.startsWith("Agency")
                    ? "ml-6 bg-zinc-50 dark:bg-zinc-950"
                    : "mr-6",
                )}
              >
                <p
                  className={cn("text-[11px] font-semibold uppercase tracking-[0.1em]",
                    agencyMutedSoft,
                  )}
                >
                  {m.who} · {m.at}
                </p>
                <p className="mt-1 text-zinc-950 dark:text-zinc-50">{m.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                className="cursor-pointer rounded-[7px] border border-zinc-300 px-2.5 py-1.5 text-left text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setText(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim()) return
              setThread((th) => [
                ...th,
                {
                  who: `Agency · ${session?.name ?? "Staff"}`,
                  body: text.trim(),
                  at: "now",
                },
              ])
              setText("")
            }}
          >
            <AgencyInput
              className="flex-1"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a reply…"
              aria-label="Message"
            />
            <AgencyPrimaryButton type="submit">Send</AgencyPrimaryButton>
          </form>
          <p className={cn("mt-2 text-xs", agencyMuted)}>
            Demo thread stays on this device only.
          </p>
        </AgencyPanel>
      </div>
    </AgencyShell>
  )
}
