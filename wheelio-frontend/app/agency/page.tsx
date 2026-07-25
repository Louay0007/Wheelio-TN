"use client"

import Link from "next/link"
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
  AgencyStat,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import {
  bookingMoneyHint,
  carsOut,
  fleetSummary,
  inboxBookings,
  nextStepForBooking,
  onboardingProgress,
  todayPickups,
  unreadMessageBookings,
  formatAgencyTnd,
} from "@/lib/agency"
import { useAgencyApiBookings } from "@/lib/hooks/use-agency-api-bookings"
import { useAgencyApiDashboard } from "@/lib/hooks/use-agency-api-ops"
import { cn } from "@/lib/utils"

export default function AgencyHomePage() {
  const { workspace, session, ready, branchId } = useAgencySession()
  const apiDash = useAgencyApiDashboard()
  const apiBookings = useAgencyApiBookings()

  if (!ready || !workspace) {
    return (
      <AgencyShell title="Home" requireAuth={false}>
        <div className="h-40 w-full animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      </AgencyShell>
    )
  }

  if (apiDash.enabled) {
    const firstName = session?.name?.split(" ")[0] ?? "there"
    const queue = (apiBookings.bookings ?? []).filter(
      (b) => b.status === "requested" || b.status === "held",
    )
    const dash = apiDash.data
    return (
      <AgencyShell
        title={`Hi ${firstName}`}
        description="Live desk board from Wheelio API."
        actions={
          <AgencyLinkButton href="/agency/bookings">
            Requests ({dash?.queues.requested ?? queue.length})
          </AgencyLinkButton>
        }
      >
        {apiDash.error || apiBookings.error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {apiDash.error ?? apiBookings.error}
          </p>
        ) : null}
        <div className="mb-6 grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AgencyStat
            label="Waiting for you"
            value={String(dash?.queues.requested ?? queue.length)}
            hint="Say yes or no"
          />
          <AgencyStat
            label="Confirmed"
            value={String(dash?.queues.confirmed ?? 0)}
            hint="Ready for pickup"
          />
          <AgencyStat
            label="Active rentals"
            value={String(dash?.queues.active ?? 0)}
            hint="Cars out now"
          />
          <AgencyStat
            label="Open bookings"
            value={String(dash?.finance.openBookings ?? 0)}
            hint="Deposit never in payouts"
          />
        </div>
        <AgencyPanel title="To do now" hint="Tap a card to take the next step.">
          {apiBookings.loading || queue.length === 0 ? (
            <AgencyEmptyState
              title={apiBookings.loading ? "Loading…" : "Nothing waiting"}
              body="When a customer books, their request will show up here."
              action={
                <Link
                  href="/agency/bookings"
                  className="text-sm font-medium underline underline-offset-4"
                >
                  Browse all bookings
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {queue.slice(0, 8).map((b) => {
                const step = nextStepForBooking(b)
                return (
                  <li key={b.id}>
                    <Link
                      href={step.href}
                      className="block rounded-[10px] border border-zinc-200 p-4 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-950"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {b.reference}
                        </span>
                        <BookingStatusChip status={b.status} />
                        <ConfirmationBadge confirmation={b.confirmation} />
                        <SlaCountdown expiresAt={b.slaExpiresAt} />
                      </div>
                      <p className="mt-2 text-base font-medium">
                        {b.customerName}
                      </p>
                      <p className={cn("mt-1 text-sm", agencyMuted)}>
                        {b.pickupLabel}
                      </p>
                      <p className="mt-2 font-mono text-sm tabular-nums">
                        {bookingMoneyHint(b)}
                      </p>
                      <p className="mt-3 text-sm font-semibold">
                        {step.label} →
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </AgencyPanel>
        <div className="mt-4">
          <AgencyTip>
            Deposit money stays at your desk and is never part of Wheelio’s fee.
          </AgencyTip>
        </div>
      </AgencyShell>
    )
  }

  const atDesk = <T extends { branchId?: string }>(rows: T[]) =>
    branchId === "all"
      ? rows
      : rows.filter((r) => !r.branchId || r.branchId === branchId)

  const queue = atDesk(inboxBookings(workspace))
  const pickups = atDesk(todayPickups(workspace))
  const out = carsOut(workspace)
  const messages = atDesk(unreadMessageBookings(workspace))
  const progress = onboardingProgress(workspace)
  const fleet = fleetSummary(workspace)
  const payout = workspace.payouts.find((p) => p.status === "scheduled")
  const firstName = session?.name?.split(" ")[0] ?? "there"

  return (
    <AgencyShell
      title={`Hi ${firstName}`}
      description="Your desk board - what needs attention right now."
      actions={
        <AgencyLinkButton href="/agency/inbox">
          New requests ({queue.length})
        </AgencyLinkButton>
      }
    >
      {progress.percent < 100 ? (
        <AgencyPanel
          className="mb-6"
          title={`Finish setup · ${progress.percent}%`}
          hint="Add your cars, prices, and desk details before you go live."
          action={
            <AgencyLinkButton href="/agency/onboarding" variant="secondary">
              Continue setup
            </AgencyLinkButton>
          }
        >
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full bg-zinc-950 transition-all dark:bg-zinc-50"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </AgencyPanel>
      ) : null}

      <div className="mb-6 grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AgencyStat
          label="Waiting for you"
          value={String(queue.filter((b) => b.status === "requested").length)}
          hint="Say yes or no"
        />
        <AgencyStat
          label="Pickups today"
          value={String(pickups.length)}
          hint="Get cars ready"
        />
        <AgencyStat
          label="Cars out now"
          value={String(out.length)}
          hint="Still with customers"
        />
        <AgencyStat
          label="Next payout"
          value={payout ? formatAgencyTnd(payout.netPayableTnd) : "-"}
          hint={payout ? payout.periodLabel : "None scheduled"}
        />
      </div>

      <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.9fr)]">
        <div className="min-w-0 space-y-4">
          <AgencyPanel title="To do now" hint="Tap a card to take the next step.">
            {queue.length === 0 ? (
              <AgencyEmptyState
                title="Nothing waiting"
                body="When a customer books, their request will show up here."
                action={
                  <Link
                    href="/agency/bookings"
                    className="text-sm font-medium underline underline-offset-4"
                  >
                    Browse all bookings
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {queue.map((b) => {
                  const step = nextStepForBooking(b)
                  return (
                    <li key={b.id}>
                      <Link
                        href={step.href}
                        className="block rounded-[10px] border border-zinc-200 p-4 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-950"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {b.reference}
                          </span>
                          <BookingStatusChip status={b.status} />
                          <ConfirmationBadge confirmation={b.confirmation} />
                          <SlaCountdown expiresAt={b.slaExpiresAt} />
                        </div>
                        <p className="mt-2 text-base font-medium">
                          {b.customerName}
                        </p>
                        <p className={cn("mt-1 text-sm", agencyMuted)}>
                          {b.categoryLabel} · {b.pickupLabel}
                        </p>
                        <p className="mt-2 font-mono text-sm tabular-nums text-zinc-800 dark:text-zinc-100">
                          {bookingMoneyHint(b)}
                        </p>
                        <p className="mt-3 text-sm font-semibold">
                          {step.label} →
                        </p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </AgencyPanel>

          {messages.length > 0 ? (
            <AgencyPanel title="Messages to answer">
              <ul className="space-y-2">
                {messages.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/agency/bookings/${b.id}/messages`}
                      className="flex items-center justify-between gap-3 rounded-[8px] border border-zinc-200 px-3 py-2.5 text-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-950"
                    >
                      <span>
                        <span className="font-mono font-semibold">
                          {b.reference}
                        </span>
                        {" · "}
                        {b.customerName}
                      </span>
                      <span className="font-semibold">
                        {b.unreadMessages} new
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AgencyPanel>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4">
          <AgencyPanel title="How you are doing">
            <div className="grid grid-cols-2 gap-3">
              <AgencyStat
                label="You accept"
                value={`${workspace.acceptanceRate}%`}
              />
              <AgencyStat
                label="Avg reply"
                value={`${workspace.avgResponseHours}h`}
              />
              <AgencyStat
                label="Quality"
                value={String(workspace.qualityScore)}
                hint="Need 85+ for Instant"
              />
              <AgencyStat
                label="Cars ready"
                value={String(fleet.ready)}
                hint={`${fleet.onRent} out · ${fleet.maintenance} workshop`}
              />
            </div>
          </AgencyPanel>

          <AgencyPanel
            title="Your cars"
            action={
              <AgencyLinkButton href="/agency/fleet" variant="secondary">
                Manage
              </AgencyLinkButton>
            }
          >
            <ul className={cn("space-y-1.5 text-sm", agencyMuted)}>
              <li>{fleet.ready} ready to rent</li>
              <li>{fleet.onRent} with customers</li>
              <li>{fleet.maintenance} in the workshop</li>
              <li>{fleet.needsPhotos} need more photos</li>
            </ul>
          </AgencyPanel>

          <AgencyPanel
            title="Money"
            action={
              <AgencyLinkButton href="/agency/payouts" variant="secondary">
                Open
              </AgencyLinkButton>
            }
          >
            {payout ? (
              <p className={cn("text-sm leading-relaxed", agencyMuted)}>
                Next payment {payout.periodLabel}:{" "}
                <span className="font-mono font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatAgencyTnd(payout.netPayableTnd)}
                </span>{" "}
                to bank ···{payout.bankLast4}
              </p>
            ) : (
              <p className={cn("text-sm", agencyMuted)}>
                No payment scheduled yet.
              </p>
            )}
            <AgencyTip>
              Deposit money stays at your desk and is never part of Wheelio’s fee.
            </AgencyTip>
          </AgencyPanel>
        </aside>
      </div>
    </AgencyShell>
  )
}
