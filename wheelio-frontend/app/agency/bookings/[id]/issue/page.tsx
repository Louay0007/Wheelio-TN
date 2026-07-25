"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { BookingSubnav } from "@/components/agency/agency-ui"
import {
  AgencyField,
  AgencyLinkButton,
  AgencyPanel,
  AgencyPrimaryButton,
  AgencySelect,
  AgencyTextarea,
  AgencyTip,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { patchBooking } from "@/lib/agency"

const TYPES = [
  "No-show",
  "Customer late",
  "Vehicle unavailable",
  "Breakdown",
  "Accident",
  "Deposit dispute",
  "Fraud suspicion",
]

export default function IssuePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { workspace, updateWorkspace, ready } = useAgencySession()
  const booking = workspace?.bookings.find((b) => b.id === id)
  const [type, setType] = useState(TYPES[0])
  const [body, setBody] = useState("")
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)

  if (!ready || !workspace) {
    return (
      <AgencyShell title="Report an issue">
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
      title={`Issue · ${booking.reference}`}
      description="Log problems so Wheelio and your team can follow up."
    >
      <BookingSubnav bookingId={id} active="issue" />

      <div className="mt-4 w-full max-w-xl space-y-4">
        <AgencyTip>
          Cancelling after you confirmed can hurt your ranking. Prefer rescheduling
          when you can.
        </AgencyTip>

        <AgencyPanel title="What happened">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setSaving(true)
              updateWorkspace((ws) => {
                if (!ws) return ws
                return patchBooking(ws, id, (b) => ({
                  ...b,
                  status: type === "No-show" ? "no_show" : b.status,
                  timeline: [
                    ...b.timeline,
                    {
                      label: `Issue · ${type}${notify ? " · Wheelio notified" : ""} · ${body}`,
                      at: new Date().toISOString(),
                    },
                  ],
                }))
              })
              router.push(`/agency/bookings/${id}`)
            }}
          >
            <AgencyField label="Issue type">
              <AgencySelect
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </AgencySelect>
            </AgencyField>
            <AgencyField label="Details" hint="What happened, when, and who was involved.">
              <AgencyTextarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </AgencyField>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4 accent-zinc-950 dark:accent-zinc-50"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
              Notify Wheelio support
            </label>
            <AgencyPrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Submit issue"}
            </AgencyPrimaryButton>
          </form>
        </AgencyPanel>
      </div>
    </AgencyShell>
  )
}
