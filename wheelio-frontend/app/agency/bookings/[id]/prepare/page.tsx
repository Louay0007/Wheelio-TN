"use client"

import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { BookingSubnav, DepositCallout } from "@/components/agency/agency-ui"
import {
  AgencyLinkButton,
  AgencyPanel,
  AgencyPrimaryButton,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { patchBooking } from "@/lib/agency"
import { cn } from "@/lib/utils"

const CHECKS = [
  "Car cleaned and fueled to your policy",
  "Documents packet ready",
  "Extras staged (child seat, GPS…)",
  "Flight or arrival time noted",
  "Pickup method confirmed with customer",
  "Staff assigned for handover",
]

export default function PreparePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { workspace, updateWorkspace, ready } = useAgencySession()
  const booking = workspace?.bookings.find((b) => b.id === id)
  const [done, setDone] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)

  const completeCount = useMemo(
    () => Object.values(done).filter(Boolean).length,
    [done],
  )
  const allDone = completeCount === CHECKS.length

  if (!ready || !workspace) {
    return (
      <AgencyShell title="Prepare car">
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
      title={`Prepare · ${booking.reference}`}
      description="Lot checklist before the customer arrives."
    >
      <BookingSubnav bookingId={id} active="prepare" />

      <div className="mt-4 w-full space-y-4">
        <DepositCallout amount={booking.depositTnd} />

        {booking.prepareReady ? (
          <AgencyTip>
            Already marked ready. You can still re-check items, then go to Give the
            car.
          </AgencyTip>
        ) : null}

        <AgencyPanel
          title="Before pickup"
          hint={`${completeCount} of ${CHECKS.length} done`}
        >
          <ul className="space-y-2">
            {CHECKS.map((label, i) => (
              <li key={label}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[8px] border border-zinc-200 px-3 dark:border-zinc-700">
                  <input
                    type="checkbox"
                    className="size-4 accent-zinc-950 dark:accent-zinc-50"
                    checked={Boolean(done[i])}
                    onChange={(e) =>
                      setDone((d) => ({ ...d, [i]: e.target.checked }))
                    }
                  />
                  <span className="text-sm text-zinc-900 dark:text-zinc-50">
                    {label}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {!allDone ? (
            <p className={cn("mt-3 text-sm", agencyMuted)}>
              Tick every item, or mark ready if your desk already finished prep.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <AgencyPrimaryButton
              type="button"
              disabled={saving}
              onClick={() => {
                setSaving(true)
                updateWorkspace((ws) => {
                  if (!ws) return ws
                  return patchBooking(ws, id, (b) => ({
                    ...b,
                    prepareReady: true,
                    timeline: [
                      ...b.timeline,
                      {
                        label: "Ready for handover",
                        at: new Date().toISOString(),
                      },
                    ],
                  }))
                })
                router.push(`/agency/bookings/${id}/handover`)
              }}
            >
              {saving ? "Saving…" : "Mark ready & give car"}
            </AgencyPrimaryButton>
            <AgencyLinkButton
              href={`/agency/bookings/${id}/messages`}
              variant="secondary"
            >
              Message customer
            </AgencyLinkButton>
          </div>
        </AgencyPanel>
      </div>
    </AgencyShell>
  )
}
