"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { AdminBookingSubnav } from "@/components/admin/admin-booking-subnav"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminAuditStrip,
  AdminChip,
  AdminKeyValue,
  AdminLinkButton,
  AdminMoneyTriad,
  AdminPanel,
  AdminSecondaryButton,
  AdminTip,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import {
  bookingStatusLabel,
  findBooking,
  formatAdminTnd,
} from "@/lib/admin"
import { millimesToTnd } from "@/lib/gateways/agency"
import { useAdminApiBooking } from "@/lib/hooks/use-admin-api"
import { startPreview } from "@/lib/preview-mode"
import { cn } from "@/lib/utils"

export default function AdminBookingCommandPage() {
  const { id } = useParams<{ id: string }>()
  const { workspace, ready } = useAdminSession()
  const api = useAdminApiBooking(id)

  const demoBooking = useMemo(
    () => (workspace ? findBooking(workspace, id) : undefined),
    [workspace, id],
  )

  if (api.enabled) {
    if (api.loading) {
      return (
        <AdminShell title="Booking">
          <div className="h-48 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        </AdminShell>
      )
    }
    if (api.error || !api.booking) {
      return (
        <AdminShell title="Booking not found">
          <p className="mb-3 text-sm text-red-600">{api.error}</p>
          <AdminLinkButton href="/admin/bookings" variant="secondary">
            All bookings
          </AdminLinkButton>
        </AdminShell>
      )
    }
    const b = api.booking
    const pricing = (b.pricing ?? {}) as Record<string, string>
    const linkedCases = (b.linkedCases ?? []) as Array<{
      id: string
      subject: string
      status: string
    }>
    const listed = millimesToTnd(pricing.commissionableMillimes ?? "0")
    const net = millimesToTnd(pricing.agencyNetMillimes ?? "0")
    const commission = millimesToTnd(pricing.commissionMillimes ?? "0")
    const deposit = millimesToTnd(
      ((b.deposit as { amountMillimes?: string } | null)?.amountMillimes ??
        pricing.depositMillimes ??
        "0") as string,
    )
    const takeRate =
      listed > 0 ? Math.round((commission / listed) * 1000) / 10 : 0

    return (
      <AdminShell
        title={String(b.reference ?? id)}
        description={`${String(b.agencyId ?? "")} · ${String((b as { contactName?: string }).contactName ?? "Guest")}`}
        actions={
          <AdminChip tone="strong">{String(b.status)}</AdminChip>
        }
      >
        <div className="w-full max-w-4xl space-y-4">
          <AdminBookingSubnav
            bookingId={String(b.bookingId ?? id)}
            active="overview"
          />
          <AdminMoneyTriad
            listed={listed}
            net={net}
            commission={commission}
            takeRate={takeRate}
            deposit={deposit}
          />
          <AdminPanel title="Linked cases">
            {linkedCases.length === 0 ? (
              <p className={cn("text-sm", adminMutedSoft)}>No support cases</p>
            ) : (
              <ul className="space-y-2">
                {linkedCases.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/cases/${c.id}`}
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {c.subject} · {c.status}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
          <AdminTip>
            API booking detail — same canonical id/version as agency and customer.
          </AdminTip>
        </div>
      </AdminShell>
    )
  }

  const booking = demoBooking
  const linkedCases =
    workspace?.cases.filter((c) => c.bookingId === booking?.id) ?? []
  const linkedClaims =
    workspace?.claims.filter((c) => c.bookingId === booking?.id) ?? []

  if (!ready || !workspace) {
    return (
      <AdminShell title="Booking">
        <div className="h-48 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!booking) {
    return (
      <AdminShell title="Booking not found">
        <AdminLinkButton href="/admin/bookings" variant="secondary">
          All bookings
        </AdminLinkButton>
      </AdminShell>
    )
  }

  const slaLeftMs = booking.slaExpiresAt
    ? new Date(booking.slaExpiresAt).getTime() - Date.now()
    : null
  const risks: string[] = []
  if (
    booking.status === "requested" &&
    slaLeftMs != null &&
    slaLeftMs < 2 * 3600_000
  ) {
    risks.push(
      slaLeftMs <= 0
        ? "SLA expired - agency silent on request-to-book"
        : `SLA expires in ${Math.max(1, Math.round(slaLeftMs / 60000))} min`,
    )
  }
  if (booking.status === "payment_pending" || booking.status === "held") {
    risks.push(`Stuck in ${bookingStatusLabel(booking.status)}`)
  }
  if (booking.hasOpenClaim) risks.push("Open claim on this trip")
  if (booking.hasOpenCase) risks.push("Open support case")

  const audit = workspace.audit.filter(
    (a) =>
      a.entity.includes(booking.reference) || a.entity.includes(booking.id),
  )

  return (
    <AdminShell
      title={booking.reference}
      description={`${booking.agencyName} · ${booking.customerName}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <AdminChip tone="strong">
            {bookingStatusLabel(booking.status)}
          </AdminChip>
          <AdminChip>
            {booking.confirmation === "instant" ? "Instant" : "Request"}
          </AdminChip>
        </div>
      }
    >
      <div className="w-full max-w-4xl space-y-4">
        <AdminBookingSubnav bookingId={booking.id} active="overview" />

        {risks.length > 0 ? (
          <div
            role="status"
            className="rounded-[10px] border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-950/30"
          >
            {risks.join(" · ")}
          </div>
        ) : null}

        <AdminMoneyTriad
          listed={booking.listedTotalTnd}
          net={booking.agencyNetTnd}
          commission={booking.commissionTnd}
          takeRate={booking.takeRatePercent}
          deposit={booking.depositTnd}
        />

        <AdminKeyValue
          rows={[
            { label: "Pickup", value: booking.pickupLabel },
            { label: "Return", value: booking.returnLabel },
            { label: "Branch", value: booking.branchLabel },
            { label: "Category", value: booking.categoryLabel },
            {
              label: "Deposit memo",
              value: formatAdminTnd(booking.depositTnd),
            },
          ]}
        />

        <AdminPanel title="Linked cases">
          {linkedCases.length === 0 ? (
            <p className={cn("text-sm", adminMutedSoft)}>No support cases</p>
          ) : (
            <ul className="space-y-2">
              {linkedCases.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/cases/${c.id}`}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {c.subject}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title="Linked claims">
          {linkedClaims.length === 0 ? (
            <p className={cn("text-sm", adminMutedSoft)}>No claims</p>
          ) : (
            <ul className="space-y-2">
              {linkedClaims.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/claims/${c.id}`}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {c.id}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminAuditStrip
          entries={audit.map((a) => ({
            at: a.at,
            actor: a.actor,
            action: a.action,
            entity: a.entity,
          }))}
        />

        <AdminSecondaryButton
          type="button"
          onClick={() =>
            startPreview({
              as: "customer",
              label: booking.reference,
              returnTo: `/admin/bookings/${booking.id}`,
            })
          }
        >
          Preview as customer
        </AdminSecondaryButton>
      </div>
    </AdminShell>
  )
}
