"use client"

import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  BookingStatusChip,
  BookingSubnav,
  ConfirmationBadge,
  DepositCallout,
  MoneyTriad,
  SlaCountdown,
} from "@/components/agency/agency-ui"
import {
  AgencyKeyValue,
  AgencyLinkButton,
  AgencyPanel,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { formatAgencyTnd, nextStepForBooking } from "@/lib/agency"
import { useAgencyApiBooking } from "@/lib/hooks/use-agency-api-bookings"
import { cn } from "@/lib/utils"

export default function AgencyBookingOverviewPage() {
  const { id } = useParams<{ id: string }>()
  const { workspace, ready } = useAgencySession()
  const api = useAgencyApiBooking(id)
  const demoBooking = workspace?.bookings.find((b) => b.id === id)
  const booking = api.enabled ? api.booking : demoBooking
  const vehicle = workspace?.vehicles.find((v) => v.id === booking?.vehicleId)
  const branch = workspace?.branches.find((b) => b.id === booking?.branchId)

  const pageReady = api.enabled ? !api.loading : ready && Boolean(workspace)

  if (!pageReady) {
    return (
      <AgencyShell title="Booking">
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

  const step = nextStepForBooking(booking)

  return (
    <AgencyShell
      title={booking.reference}
      description={`${booking.customerName} · ${booking.pickupLabel}`}
      actions={
        <AgencyLinkButton href={step.href}>{step.label}</AgencyLinkButton>
      }
    >
      <BookingSubnav bookingId={booking.id} active="overview" />

      <div className="mt-4 w-full space-y-4">
        {api.enabled ? (
          <AgencyTip>Live API booking · version {api.version}</AgencyTip>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusChip status={booking.status} />
          <ConfirmationBadge confirmation={booking.confirmation} />
          <SlaCountdown expiresAt={booking.slaExpiresAt} />
        </div>

        <AgencyPanel>
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Next: {step.label}
          </p>
          <p className={cn("mt-1 text-sm", agencyMuted)}>
            Prices on this booking are locked. Deposit is never part of your fee.
          </p>
        </AgencyPanel>

        <MoneyTriad
          listed={booking.listedTotalTnd}
          net={booking.agencyNetTnd}
          commission={booking.commissionTnd}
          takeRate={booking.takeRatePercent}
        />
        <DepositCallout amount={booking.depositTnd} />

        <div className="grid gap-4 lg:grid-cols-2">
          <AgencyPanel title="Customer">
            <AgencyKeyValue
              rows={[
                { label: "Driver", value: booking.driverName },
                { label: "Email", value: booking.customerEmail },
                { label: "Phone", value: booking.customerPhone },
                { label: "Flight", value: booking.flightNumber ?? "-" },
                {
                  label: "How they pay",
                  value:
                    booking.paymentMode === "deposit_online"
                      ? "Paid a deposit online"
                      : "Pay at your desk",
                },
              ]}
            />
          </AgencyPanel>
          <AgencyPanel title="Trip">
            <AgencyKeyValue
              rows={[
                { label: "Pickup", value: booking.pickupLabel },
                { label: "Return", value: booking.returnLabel },
                {
                  label: "Desk",
                  value: branch?.name ?? booking.branchId,
                },
                {
                  label: "Vehicle",
                  value: vehicle
                    ? `${vehicle.plate} · ${vehicle.makeModel}`
                    : "Assign at accept/handover",
                },
                {
                  label: "Customer price",
                  value: formatAgencyTnd(booking.listedTotalTnd),
                },
              ]}
            />
          </AgencyPanel>
        </div>
      </div>
    </AgencyShell>
  )
}
