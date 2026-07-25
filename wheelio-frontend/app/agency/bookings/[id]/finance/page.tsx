"use client"

import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  BookingSubnav,
  DepositCallout,
  MoneyTriad,
} from "@/components/agency/agency-ui"
import {
  AgencyKeyValue,
  AgencyLinkButton,
  AgencyPanel,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { formatAgencyTnd } from "@/lib/agency"
import { cn } from "@/lib/utils"

export default function FinancePage() {
  const { id } = useParams<{ id: string }>()
  const { workspace, ready } = useAgencySession()
  const booking = workspace?.bookings.find((b) => b.id === id)
  const payout = workspace?.payouts.find((p) => p.bookingIds.includes(id))

  if (!ready || !workspace) {
    return (
      <AgencyShell title="Money on this booking">
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
      title={`Money · ${booking.reference}`}
      description="Fee = customer price × your rate. Deposit is never in that fee."
    >
      <BookingSubnav bookingId={id} active="finance" />

      <div className="mt-4 w-full max-w-2xl space-y-4">
        <MoneyTriad
          listed={booking.listedTotalTnd}
          net={booking.agencyNetTnd}
          commission={booking.commissionTnd}
          takeRate={booking.takeRatePercent}
        />
        <DepositCallout amount={booking.depositTnd} />

        <AgencyPanel title="Breakdown">
          <AgencyKeyValue
            rows={[
              {
                label: "Price for customer",
                value: formatAgencyTnd(booking.listedTotalTnd),
              },
              {
                label: `Wheelio fee (${booking.takeRatePercent}%)`,
                value: formatAgencyTnd(booking.commissionTnd),
              },
              {
                label: "You keep (net)",
                value: formatAgencyTnd(booking.agencyNetTnd),
              },
              {
                label: "Collected online",
                value: formatAgencyTnd(booking.onlineCollectedTnd),
              },
              {
                label: "Still due at desk",
                value: formatAgencyTnd(booking.deskDueTnd),
              },
              {
                label: "Deposit (memo only)",
                value: formatAgencyTnd(booking.depositTnd),
              },
            ]}
          />
        </AgencyPanel>

        {payout ? (
          <AgencyPanel title="Payout">
            <p className="text-sm text-zinc-900 dark:text-zinc-50">
              Included in{" "}
              <a
                href={`/agency/payouts/${payout.id}`}
                className="font-medium underline underline-offset-4"
              >
                {payout.periodLabel}
              </a>
            </p>
          </AgencyPanel>
        ) : (
          <AgencyTip>
            Not in a payout batch yet. Completed trips show under Payments to you.
          </AgencyTip>
        )}

        <p className={cn("text-sm", agencyMuted)}>
          Demo numbers. Live payouts will match your bank schedule.
        </p>
      </div>
    </AgencyShell>
  )
}
