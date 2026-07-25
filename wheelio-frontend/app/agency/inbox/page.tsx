"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyEmptyState,
  BookingStatusChip,
  ConfirmationBadge,
  SlaCountdown,
} from "@/components/agency/agency-ui"
import {
  AgencyLinkButton,
  AgencyPanel,
  AgencyTabs,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { bookingMoneyHint } from "@/lib/agency"
import { useAgencyApiBookings } from "@/lib/hooks/use-agency-api-bookings"
import { cn } from "@/lib/utils"

type Tab = "decision" | "expiring" | "instant" | "all"

export default function AgencyInboxPage() {
  const { workspace, ready, branchId } = useAgencySession()
  const api = useAgencyApiBookings()
  const [tab, setTab] = useState<Tab>("decision")

  const inDesk = (branch?: string | null) =>
    branchId === "all" || !branch || branch === branchId

  const source = api.enabled
    ? (api.bookings ?? [])
    : (workspace?.bookings ?? [])

  const counts = useMemo(() => {
    const now = Date.now()
    const requested = source.filter(
      (b) => b.status === "requested" && inDesk(b.branchId),
    )
    const instantPrep = source.filter(
      (b) =>
        b.status === "confirmed" &&
        b.confirmation === "instant" &&
        !("prepareReady" in b && b.prepareReady) &&
        inDesk(b.branchId),
    )
    const expiring = requested.filter(
      (b) =>
        b.slaExpiresAt &&
        new Date(b.slaExpiresAt).getTime() - now < 2 * 3600_000,
    )
    return {
      decision: requested.length,
      expiring: expiring.length,
      instant: instantPrep.length,
      all: requested.length + instantPrep.length,
    }
  }, [source, branchId])

  const rows = useMemo(() => {
    const now = Date.now()
    const requested = source.filter(
      (b) => b.status === "requested" && inDesk(b.branchId),
    )
    const instantPrep = source.filter(
      (b) =>
        b.status === "confirmed" &&
        b.confirmation === "instant" &&
        !("prepareReady" in b && b.prepareReady) &&
        inDesk(b.branchId),
    )
    if (tab === "decision") return requested
    if (tab === "expiring")
      return requested
        .filter(
          (b) =>
            b.slaExpiresAt &&
            new Date(b.slaExpiresAt).getTime() - now < 2 * 3600_000,
        )
        .sort(
          (a, b) =>
            new Date(a.slaExpiresAt!).getTime() -
            new Date(b.slaExpiresAt!).getTime(),
        )
    if (tab === "instant") return instantPrep
    return [...requested, ...instantPrep]
  }, [source, tab, branchId])

  const loading = api.enabled ? api.loading : !ready || !workspace

  return (
    <AgencyShell
      title="New requests"
      description="Answer bookings here. Reply before the timer ends so customers are not left waiting."
    >
      {loading ? (
        <div className="h-40 w-full animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          {api.error ? (
            <p className="text-sm text-red-600" role="alert">
              {api.error}
            </p>
          ) : null}
          <AgencyTip>
            Tip: open a request, choose a free car if needed, then tap Accept. If
            you cannot take it, Decline and pick a reason.
          </AgencyTip>

          <AgencyTabs
            value={tab}
            onChange={setTab}
            items={[
              {
                id: "decision",
                label: "Need your answer",
                count: counts.decision,
              },
              {
                id: "expiring",
                label: "Almost out of time",
                count: counts.expiring,
              },
              {
                id: "instant",
                label: "Instant - get ready",
                count: counts.instant,
              },
              { id: "all", label: "All open", count: counts.all },
            ]}
          />

          {rows.length === 0 ? (
            <AgencyEmptyState
              title="Inbox is clear"
              body="No requests right now. New customer bookings will appear here with a reply timer."
              action={
                <AgencyLinkButton href="/agency/bookings" variant="secondary">
                  See all bookings
                </AgencyLinkButton>
              }
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((b) => (
                <li key={b.id}>
                  <AgencyPanel>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {b.reference}
                      </span>
                      <BookingStatusChip status={b.status} />
                      <ConfirmationBadge confirmation={b.confirmation} />
                      <SlaCountdown expiresAt={b.slaExpiresAt} />
                    </div>
                    <p className="mt-3 text-base font-medium">{b.customerName}</p>
                    <p className={cn("mt-1 text-sm", agencyMuted)}>
                      Pickup {b.pickupLabel} · Return {b.returnLabel}
                    </p>
                    <p className="mt-3 font-mono text-sm tabular-nums">
                      {bookingMoneyHint(b)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <AgencyLinkButton
                        href={
                          b.status === "requested"
                            ? `/agency/bookings/${b.id}/accept`
                            : `/agency/bookings/${b.id}/prepare`
                        }
                      >
                        {b.status === "requested"
                          ? "Accept or decline"
                          : "Get ready"}
                      </AgencyLinkButton>
                      <Link
                        href={`/agency/bookings/${b.id}`}
                        className="inline-flex h-11 items-center px-2 text-sm font-medium underline underline-offset-4"
                      >
                        Full details
                      </Link>
                    </div>
                  </AgencyPanel>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AgencyShell>
  )
}
