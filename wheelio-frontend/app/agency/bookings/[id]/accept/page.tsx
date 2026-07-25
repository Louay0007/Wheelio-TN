"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  BookingSubnav,
  DepositCallout,
  MoneyTriad,
  SlaCountdown,
} from "@/components/agency/agency-ui"
import {
  AgencyField,
  AgencyPanel,
  AgencyPrimaryButton,
  AgencySecondaryButton,
  AgencySelect,
  AgencyTextarea,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import {
  findBooking,
  patchBooking,
  readyVehiclesForBranch,
} from "@/lib/agency"
import {
  acceptAgencyBooking,
  declineAgencyBooking,
  fetchAgencyFleet,
} from "@/lib/gateways/agency"
import { useAgencyApiBooking } from "@/lib/hooks/use-agency-api-bookings"
import { cn } from "@/lib/utils"

const REJECT_REASONS = [
  { id: "unavailable", label: "No car available" },
  { id: "documents", label: "Driver papers not OK" },
  { id: "out_of_area", label: "Outside our area" },
  { id: "other", label: "Other reason" },
] as const

export default function AgencyAcceptPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { workspace, updateWorkspace, ready } = useAgencySession()
  const api = useAgencyApiBooking(id)
  const demoBooking = workspace ? findBooking(workspace, id) : undefined
  const booking = api.enabled ? api.booking : demoBooking
  const [apiCars, setApiCars] = useState<
    Array<{ id: string; label: string }>
  >([])
  const readyCars = useMemo(() => {
    if (api.enabled) return apiCars
    if (!workspace || !booking) return []
    return readyVehiclesForBranch(workspace, booking.branchId).map((v) => ({
      id: v.id,
      label: `${v.plate} · ${v.makeModel}`,
    }))
  }, [api.enabled, apiCars, workspace, booking])
  const [vehicleId, setVehicleId] = useState("")
  const [note, setNote] = useState("")
  const [rejectReason, setRejectReason] =
    useState<(typeof REJECT_REASONS)[number]["id"]>("unavailable")
  const [rejectText, setRejectText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!api.enabled) return
    let cancelled = false
    fetchAgencyFleet()
      .then((rows) => {
        if (cancelled) return
        setApiCars(
          rows
            .filter((r) => r.status === "ready")
            .map((r) => ({
              id: r.id,
              label: `${r.make} ${r.model}`,
            })),
        )
      })
      .catch(() => {
        if (!cancelled) setApiCars([])
      })
    return () => {
      cancelled = true
    }
  }, [api.enabled])

  const pageReady = api.enabled
    ? !api.loading
    : ready && Boolean(workspace)

  if (!pageReady) {
    return (
      <AgencyShell title="Accept">
        <div className="h-32 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      </AgencyShell>
    )
  }

  if (!booking) {
    return (
      <AgencyShell title="Booking not found">
        <p className={cn("text-sm", agencyMuted)}>
          {api.error ?? "No booking with this id."}
        </p>
      </AgencyShell>
    )
  }

  const locked = !["requested", "held"].includes(booking.status)

  async function onAccept() {
    if (!booking) return
    if (booking.hasConflict && !vehicleId) {
      alert("This request has a date clash. Please pick a free car first.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (api.enabled) {
        await acceptAgencyBooking(id, {
          expectedVersion: api.version,
          vehicleId: vehicleId || undefined,
          note: note || undefined,
        })
      } else {
        updateWorkspace((ws) => {
          if (!ws) return ws
          return patchBooking(ws, id, (b) => ({
            ...b,
            status: "confirmed",
            vehicleId: vehicleId || b.vehicleId,
            slaExpiresAt: undefined,
            timeline: [
              ...b.timeline,
              {
                label: `Accepted${note ? ` · ${note}` : ""}`,
                at: new Date().toISOString(),
              },
            ],
          }))
        })
      }
      router.push(`/agency/bookings/${id}/prepare`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AgencyShell
      title={`Accept or decline · ${booking.reference}`}
      description="Say yes to keep the booking, or no with a short reason."
    >
      <BookingSubnav bookingId={booking.id} active="accept" />
      <div className="mb-4 flex flex-wrap gap-2">
        <SlaCountdown expiresAt={booking.slaExpiresAt} />
        {booking.hasConflict ? (
          <span className="rounded-[6px] border border-zinc-400 px-2 py-1 text-xs font-semibold">
            Warning: dates may clash - pick a free car
          </span>
        ) : null}
      </div>

      <MoneyTriad
        listed={booking.listedTotalTnd}
        net={booking.agencyNetTnd}
        commission={booking.commissionTnd}
        takeRate={booking.takeRatePercent}
      />
      <div className="mt-3 mb-6">
        <DepositCallout amount={booking.depositTnd} />
      </div>

      {error ? (
        <p className="mb-3 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}

      {locked ? (
        <AgencyPanel>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">
            This booking is already{" "}
            <strong>{booking.status.replaceAll("_", " ")}</strong>.
          </p>
          <Link
            href={`/agency/bookings/${booking.id}`}
            className="mt-3 inline-flex text-sm font-medium underline"
          >
            Open booking
          </Link>
        </AgencyPanel>
      ) : (
        <div className="grid w-full gap-4 lg:grid-cols-2">
          <AgencyPanel
            title="Accept"
            hint="Choose a free car if you can. You can also accept a pool car and assign the plate later."
          >
            <div className="space-y-3">
              <AgencyField label="Which car?" hint="Optional for “or similar” cars">
                <AgencySelect
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="">Choose later at pickup</option>
                  {readyCars.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </AgencySelect>
              </AgencyField>
              <AgencyField label="Short note to customer (optional)">
                <AgencyTextarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Example: Meet us at Terminal 1 arrivals desk."
                />
              </AgencyField>
              <AgencyPrimaryButton
                type="button"
                className="w-full"
                disabled={busy}
                onClick={() => void onAccept()}
              >
                {busy ? "Accepting…" : "Accept booking"}
              </AgencyPrimaryButton>
            </div>
          </AgencyPanel>

          <AgencyPanel
            title="Decline"
            hint="Be clear. The customer will be told so they can book elsewhere."
          >
            <div className="space-y-3">
              <AgencyField label="Why?">
                <AgencySelect
                  value={rejectReason}
                  onChange={(e) =>
                    setRejectReason(
                      e.target.value as (typeof REJECT_REASONS)[number]["id"],
                    )
                  }
                >
                  {REJECT_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </AgencySelect>
              </AgencyField>
              <AgencyField label="More details">
                <AgencyTextarea
                  value={rejectText}
                  onChange={(e) => setRejectText(e.target.value)}
                  placeholder="Optional extra detail"
                />
              </AgencyField>
              <AgencyTip>
                Declining after you already confirmed can hurt your ranking.
              </AgencyTip>
              <AgencySecondaryButton
                type="button"
                className="w-full"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true)
                    setError(null)
                    try {
                      if (api.enabled) {
                        await declineAgencyBooking(id, {
                          expectedVersion: api.version,
                          reasonCode: rejectReason,
                          note: rejectText || undefined,
                        })
                      } else {
                        updateWorkspace((ws) => {
                          if (!ws) return ws
                          return patchBooking(ws, id, (b) => ({
                            ...b,
                            status: "rejected",
                            slaExpiresAt: undefined,
                            timeline: [
                              ...b.timeline,
                              {
                                label: `Declined · ${rejectReason}${rejectText ? ` · ${rejectText}` : ""}`,
                                at: new Date().toISOString(),
                              },
                            ],
                          }))
                        })
                      }
                      router.push(`/agency/bookings/${id}`)
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "Decline failed",
                      )
                    } finally {
                      setBusy(false)
                    }
                  })()
                }}
              >
                Decline booking
              </AgencySecondaryButton>
            </div>
          </AgencyPanel>
        </div>
      )}

      <p className={cn("mt-4 text-sm", agencyMuted)}>
        Customer: {booking.customerName} · {booking.pickupLabel}
      </p>
    </AgencyShell>
  )
}
