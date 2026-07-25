"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
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
  AgencySecondaryButton,
  AgencySelect,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { formatAgencyTnd, patchBooking } from "@/lib/agency"
import { completeAgencyHandover } from "@/lib/gateways/agency"
import { useAgencyApiBooking } from "@/lib/hooks/use-agency-api-bookings"
import { cn } from "@/lib/utils"

const STEPS = [
  "Check booking code",
  "Check driver papers",
  "Record odometer & fuel",
  "Collect deposit",
  "Start the rental",
]

export default function HandoverPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { workspace, updateWorkspace, ready } = useAgencySession()
  const api = useAgencyApiBooking(id)
  const demoBooking = workspace?.bookings.find((b) => b.id === id)
  const booking = api.enabled ? api.booking : demoBooking
  const [step, setStep] = useState(0)
  const [odometer, setOdometer] = useState("12450")
  const [fuel, setFuel] = useState("Full")
  const [depositMethod, setDepositMethod] = useState("cash")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canStart = booking?.status === "confirmed"

  const progress = useMemo(
    () => Math.round(((step + 1) / STEPS.length) * 100),
    [step],
  )

  const pageReady = api.enabled ? !api.loading : ready && Boolean(workspace)

  if (!pageReady) {
    return (
      <AgencyShell title="Give the car">
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

  async function finish() {
    if (!booking) return
    setSaving(true)
    setError(null)
    try {
      if (api.enabled) {
        const depositMillimes = String(Math.round(booking.depositTnd * 1000))
        await completeAgencyHandover(id, {
          expectedVersion: api.version,
          odometer: Number(odometer) || undefined,
          fuelLevel: fuel,
          depositMemoMillimes: depositMillimes,
          deskCollectedMillimes: String(
            Math.round(booking.deskDueTnd * 1000),
          ),
        })
      } else {
        updateWorkspace((ws) => {
          if (!ws) return ws
          let next = patchBooking(ws, id, (b) => ({
            ...b,
            status: "active",
            timeline: [
              ...b.timeline,
              {
                label: `Car given · odo ${odometer} · fuel ${fuel} · deposit ${depositMethod}`,
                at: new Date().toISOString(),
              },
            ],
          }))
          next = {
            ...next,
            vehicles: next.vehicles.map((v) =>
              v.id === booking.vehicleId ? { ...v, status: "on_rent" } : v,
            ),
          }
          return next
        })
      }
      router.push(`/agency/bookings/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Handover failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AgencyShell
      title={`Give the car · ${booking.reference}`}
      description="Desk checklist for pickup day. Deposit stays separate from Wheelio’s fee."
    >
      <BookingSubnav bookingId={id} active="handover" />

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

        {!canStart ? (
          <AgencyPanel title="Not ready yet">
            <p className={cn("text-sm", agencyMuted)}>
              This booking must be confirmed before you can hand over the car.
              Current status: {booking.status.replaceAll("_", " ")}.
            </p>
            <div className="mt-4">
              <AgencyLinkButton href={`/agency/bookings/${id}`} variant="secondary">
                Open booking
              </AgencyLinkButton>
            </div>
          </AgencyPanel>
        ) : (
          <>
            <AgencyPanel
              title={STEPS[step]}
              hint={`Step ${step + 1} of ${STEPS.length}`}
            >
              <div
                className="mb-4 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                aria-hidden
              >
                <div
                  className="h-full bg-zinc-950 transition-all dark:bg-zinc-50"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {step === 0 ? (
                <div className="space-y-3">
                  <p className="font-mono text-3xl font-semibold tracking-tight">
                    {booking.reference}
                  </p>
                  <AgencyTip>
                    Match the customer voucher or QR to this code before you continue.
                  </AgencyTip>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className={agencyMuted}>Driver: </span>
                    {booking.driverName}
                  </p>
                  <p>
                    <span className={agencyMuted}>Phone: </span>
                    {booking.customerPhone}
                  </p>
                  <AgencyTip>
                    Check licence and ID in person. Keep paper copies with your desk
                    process.
                  </AgencyTip>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <AgencyField label="Odometer (km)">
                    <AgencyInput
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      inputMode="numeric"
                    />
                  </AgencyField>
                  <AgencyField label="Fuel level">
                    <AgencyInput
                      value={fuel}
                      onChange={(e) => setFuel(e.target.value)}
                    />
                  </AgencyField>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-3">
                  <DepositCallout amount={booking.depositTnd} />
                  <AgencyField
                    label="How they paid the deposit"
                    hint={`Rental still due at desk: ${formatAgencyTnd(booking.deskDueTnd)}`}
                  >
                    <AgencySelect
                      value={depositMethod}
                      onChange={(e) => setDepositMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card at desk</option>
                      <option value="held">Already held online</option>
                    </AgencySelect>
                  </AgencyField>
                </div>
              ) : null}

              {step === 4 ? (
                <AgencyTip>
                  Capture condition notes and photos if your desk requires them.
                  Customer signs your paper, then start the rental.
                </AgencyTip>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {step > 0 ? (
                  <AgencySecondaryButton
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    Back
                  </AgencySecondaryButton>
                ) : null}
                {step < STEPS.length - 1 ? (
                  <AgencyPrimaryButton
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                  >
                    Continue
                  </AgencyPrimaryButton>
                ) : (
                  <AgencyPrimaryButton
                    type="button"
                    disabled={saving}
                    onClick={() => void finish()}
                  >
                    {saving ? "Saving…" : "Start rental"}
                  </AgencyPrimaryButton>
                )}
              </div>
            </AgencyPanel>
          </>
        )}
      </div>
    </AgencyShell>
  )
}
