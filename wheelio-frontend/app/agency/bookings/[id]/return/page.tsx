"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  BookingSubnav,
  DepositCallout,
  MoneyTriad,
} from "@/components/agency/agency-ui"
import {
  AgencyField,
  AgencyInput,
  AgencyLinkButton,
  AgencyPanel,
  AgencyPrimaryButton,
  AgencySelect,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { formatAgencyTnd, patchBooking } from "@/lib/agency"
import { completeAgencyReturn } from "@/lib/gateways/agency"
import { useAgencyApiBooking } from "@/lib/hooks/use-agency-api-bookings"
import { cn } from "@/lib/utils"

export default function ReturnPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { workspace, updateWorkspace, ready } = useAgencySession()
  const api = useAgencyApiBooking(id)
  const demoBooking = workspace?.bookings.find((b) => b.id === id)
  const booking = api.enabled ? api.booking : demoBooking
  const [odoOut] = useState("12450")
  const [odoIn, setOdoIn] = useState("12890")
  const [extra, setExtra] = useState(0)
  const [depositAction, setDepositAction] = useState<"release" | "hold">(
    "release",
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pageReady = api.enabled ? !api.loading : ready && Boolean(workspace)

  if (!pageReady) {
    return (
      <AgencyShell title="Take the car back">
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

  const canClose = booking.status === "active"

  async function completeReturn() {
    if (!booking) return
    setSaving(true)
    setError(null)
    try {
      if (api.enabled) {
        await completeAgencyReturn(id, {
          expectedVersion: api.version,
          odometer: Number(odoIn) || undefined,
          proposedChargesMillimes: String(Math.round(extra * 1000)),
          depositReleaseMillimes:
            depositAction === "release"
              ? String(Math.round(booking.depositTnd * 1000))
              : "0",
        })
      } else {
        updateWorkspace((ws) => {
          if (!ws) return ws
          let next = patchBooking(ws, id, (b) => ({
            ...b,
            status: "completed",
            deskDueTnd: 0,
            timeline: [
              ...b.timeline,
              {
                label: `Returned · odo ${odoIn} · extras ${extra} · deposit ${depositAction}`,
                at: new Date().toISOString(),
              },
            ],
          }))
          next = {
            ...next,
            vehicles: next.vehicles.map((v) =>
              v.id === booking.vehicleId ? { ...v, status: "ready" } : v,
            ),
          }
          return next
        })
      }
      router.push(`/agency/bookings/${id}/finance`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Return failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AgencyShell
      title={`Take back · ${booking.reference}`}
      description="Close the rental. Wheelio’s fee stays on the trip total, never the deposit."
    >
      <BookingSubnav bookingId={id} active="return" />

      <div className="mt-4 w-full space-y-4">
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        ) : null}
        <MoneyTriad
          listed={booking.listedTotalTnd}
          net={booking.agencyNetTnd}
          commission={booking.commissionTnd}
          takeRate={booking.takeRatePercent}
        />
        <DepositCallout amount={booking.depositTnd} />

        {!canClose ? (
          <AgencyPanel title="Rental not active">
            <p className={cn("text-sm", agencyMuted)}>
              You can only complete return while the booking is active. Current
              status: {booking.status.replaceAll("_", " ")}.
            </p>
          </AgencyPanel>
        ) : (
          <AgencyPanel title="Return checklist">
            <div className="grid gap-3 sm:grid-cols-2">
              <AgencyField label="Odometer out (km)">
                <AgencyInput value={odoOut} readOnly />
              </AgencyField>
              <AgencyField label="Odometer in (km)">
                <AgencyInput
                  value={odoIn}
                  onChange={(e) => setOdoIn(e.target.value)}
                  inputMode="numeric"
                />
              </AgencyField>
              <AgencyField
                label="Extra charges (TND)"
                hint="Fuel, late return, damage. Not part of Wheelio fee."
              >
                <AgencyInput
                  type="number"
                  min={0}
                  value={extra}
                  onChange={(e) => setExtra(Number(e.target.value))}
                />
              </AgencyField>
              <AgencyField label="Deposit">
                <AgencySelect
                  value={depositAction}
                  onChange={(e) =>
                    setDepositAction(e.target.value as "release" | "hold")
                  }
                >
                  <option value="release">
                    Release full ({formatAgencyTnd(booking.depositTnd)})
                  </option>
                  <option value="hold">Hold for review</option>
                </AgencySelect>
              </AgencyField>
            </div>

            <AgencyTip>
              Completing return marks the booking finished and frees the car for
              the next trip.
            </AgencyTip>

            <div className="mt-5 flex flex-wrap gap-2">
              <AgencyPrimaryButton
                type="button"
                disabled={saving}
                onClick={() => void completeReturn()}
              >
                {saving ? "Saving…" : "Complete return"}
              </AgencyPrimaryButton>
              <AgencyLinkButton
                href={`/agency/bookings/${id}/issue`}
                variant="secondary"
              >
                Report an issue
              </AgencyLinkButton>
            </div>
          </AgencyPanel>
        )}
      </div>
    </AgencyShell>
  )
}
