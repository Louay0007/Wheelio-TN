"use client"

import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminField,
  AdminPanel,
  AdminSelect,
  AdminStat,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminReconciliationPage() {
  const { workspace, ready } = useAdminSession()
  const [period, setPeriod] = useState("jul-2026")

  if (!ready || !workspace) {
    return (
      <AdminShell title="Reconciliation">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const gmv = workspace.bookings.reduce((s, b) => s + b.listedTotalTnd, 0)
  const commission = workspace.bookings.reduce((s, b) => s + b.commissionTnd, 0)
  const payouts = workspace.payoutBatches.reduce((s, p) => s + p.netPayableTnd, 0)
  const refunds = workspace.refunds.reduce((s, r) => s + r.customerAmountTnd, 0)
  const unbatched = workspace.bookings.filter(
    (b) =>
      b.status === "completed" &&
      !workspace.payoutBatches.some((p) => p.bookingIds.includes(b.id)),
  ).length

  return (
    <AdminShell
      title="Reconciliation"
      description="Period close stub: totals vs ledger."
    >
      <div className="space-y-4">
        <AdminField label="Period">
          <AdminSelect value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="jul-2026">July 2026</option>
            <option value="jun-2026">June 2026</option>
          </AdminSelect>
        </AdminField>

        <AdminTip>Lock period requires super or finance (not wired in demo).</AdminTip>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStat label="GMV (excl. deposit)" value={formatAdminTnd(gmv)} />
          <AdminStat label="Commission" value={formatAdminTnd(commission)} />
          <AdminStat label="Payouts net" value={formatAdminTnd(payouts)} />
          <AdminStat label="Refunds sent" value={formatAdminTnd(refunds)} />
        </div>

        <AdminPanel title="Exceptions">
          <ul className={cn("space-y-2 text-sm", adminMuted)}>
            <li>Unbatched completed trips: {unbatched}</li>
            <li>
              Failed payouts:{" "}
              {workspace.payoutBatches.filter((p) => p.status === "failed").length}
            </li>
            <li>
              Held payouts:{" "}
              {workspace.payoutBatches.filter((p) => p.status === "held").length}
            </li>
          </ul>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
