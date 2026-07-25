"use client"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminLinkButton,
  AdminPanel,
  AdminStat,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminAnalyticsFinancePage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Finance analytics">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const gmv = workspace.bookings
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + b.listedTotalTnd, 0)
  const commission = workspace.bookings.reduce((s, b) => s + b.commissionTnd, 0)
  const payoutQueue = workspace.payoutBatches.filter((p) => p.status !== "paid").length
  const refundCount = workspace.refunds.length

  return (
    <AdminShell
      title="Finance analytics"
      description="Monochrome KPI cards with plain language definitions."
      actions={
        <AdminLinkButton href="/admin/analytics" variant="secondary">
          Overview
        </AdminLinkButton>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat
          label="Completed GMV"
          value={formatAdminTnd(gmv)}
          hint="Listed trip totals only. Deposit excluded."
        />
        <AdminStat
          label="Commission booked"
          value={formatAdminTnd(commission)}
          hint="Wheelio fee on listed totals at agency take rate."
        />
        <AdminStat
          label="Open payout batches"
          value={String(payoutQueue)}
          hint="Draft, held, or scheduled, not yet paid."
        />
        <AdminStat
          label="Refund tickets"
          value={String(refundCount)}
          hint="Customer, clawback, and absorb tracked separately."
        />
      </div>

      <AdminPanel className="mt-4" title="Definitions">
        <dl className={cn("space-y-3 text-sm")}>
          <div>
            <dt className="font-semibold">GMV</dt>
            <dd className={adminMuted}>
              Gross merchandise value: what customers pay for the mandatory trip, not security
              deposit.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Take rate</dt>
            <dd className={adminMuted}>
              Percent of listed trip total kept by Wheelio before paying agency net.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Unreconciled</dt>
            <dd className={adminMutedSoft}>
              Demo noise: trips that finished online but still need a human check in finance.
            </dd>
          </div>
        </dl>
      </AdminPanel>
    </AdminShell>
  )
}
