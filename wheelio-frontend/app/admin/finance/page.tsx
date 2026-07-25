"use client"

import { useMemo } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminLinkButton,
  AdminPanel,
  AdminStat,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminFinanceHomePage() {
  const { workspace, ready } = useAdminSession()

  const stats = useMemo(() => {
    if (!workspace) return null
    const commission = workspace.bookings
      .filter((b) => ["confirmed", "active", "completed"].includes(b.status))
      .reduce((s, b) => s + b.commissionTnd, 0)
    const gmv = workspace.bookings
      .filter((b) => ["confirmed", "active", "completed"].includes(b.status))
      .reduce((s, b) => s + b.listedTotalTnd, 0)
    const depositMemo = workspace.bookings.reduce((s, b) => s + b.depositTnd, 0)
    const payoutsOpen = workspace.payoutBatches.filter((p) =>
      ["draft", "pending_approval", "scheduled", "held"].includes(p.status),
    )
    const refundsOpen = workspace.refunds.filter((r) =>
      ["requested", "approved"].includes(r.status),
    )
    const unreconciled = workspace.bookings.filter(
      (b) => b.status === "completed" && b.paymentMode === "deposit_online",
    ).length
    return { commission, gmv, depositMemo, payoutsOpen, refundsOpen, unreconciled }
  }, [workspace])

  return (
    <AdminShell
      title="Finance"
      description="Marketplace money control plane. Deposit is memo-only."
    >
      {!ready || !workspace || !stats ? (
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          <AdminTip>
            Standard take rate {workspace.takeRateStandard}%. Launch / volume{" "}
            {workspace.takeRateLaunch}%. Deposit never enters GMV or commission.
          </AdminTip>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStat
              label="Commission accrued"
              value={formatAdminTnd(stats.commission)}
              hint={`${workspace.takeRateStandard}% standard context`}
              href="/admin/finance/commissions"
            />
            <AdminStat
              label="Payouts open"
              value={String(stats.payoutsOpen.length)}
              hint={formatAdminTnd(
                stats.payoutsOpen.reduce((s, p) => s + p.netPayableTnd, 0),
              )}
              href="/admin/finance/payouts"
            />
            <AdminStat
              label="Refunds open"
              value={String(stats.refundsOpen.length)}
              hint="Policy and claims"
              href="/admin/finance/refunds"
            />
            <AdminStat
              label="Unreconciled"
              value={String(stats.unreconciled)}
              hint="Completed online-deposit trips"
              href="/admin/finance/reconciliation"
            />
          </div>

          <AdminPanel title="Deposit memo (informational)">
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {formatAdminTnd(stats.depositMemo)}
            </p>
            <p className={cn("mt-1 text-sm", adminMuted)}>
              Excluded from GMV and commission. Shown so ops can see holds at stake.
            </p>
          </AdminPanel>

          <AdminPanel title="Shortcuts">
            <div className="flex flex-wrap gap-2">
              <AdminLinkButton href="/admin/finance/ledger">Ledger</AdminLinkButton>
              <AdminLinkButton href="/admin/finance/payouts">Payouts</AdminLinkButton>
              <AdminLinkButton href="/admin/finance/payouts/new" variant="secondary">
                Create batch
              </AdminLinkButton>
              <AdminLinkButton href="/admin/finance/refunds" variant="secondary">
                Refunds
              </AdminLinkButton>
              <AdminLinkButton href="/admin/finance/commissions" variant="secondary">
                Commissions
              </AdminLinkButton>
              <AdminLinkButton href="/admin/finance/reconciliation" variant="secondary">
                Reconciliation
              </AdminLinkButton>
            </div>
          </AdminPanel>
        </div>
      )}
    </AdminShell>
  )
}
