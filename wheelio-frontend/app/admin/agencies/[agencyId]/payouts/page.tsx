"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminPanel,
  AdminSelect,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findAgency, formatAdminTnd } from "@/lib/admin"
import type { AdminPayoutBatch } from "@/lib/admin"
import { cn } from "@/lib/utils"

type StatusFilter = AdminPayoutBatch["status"] | "all"

export default function AdminAgencyPayoutsPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session } = useAdminSession()
  const [status, setStatus] = useState<StatusFilter>("all")

  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )

  const batches = useMemo(() => {
    if (!workspace || !agency) return []
    return workspace.payoutBatches.filter((p) => {
      if (p.agencyId !== agency.id) return false
      if (status === "all") return true
      return p.status === status
    })
  }, [workspace, agency, status])

  if (!workspace || !session) {
    return (
      <AdminShell title="Payouts">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!agency) {
    return (
      <AdminShell title="Payouts">
        <p className="text-sm">Agency not found.</p>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Payouts"
      description={agency.tradeName}
      actions={
        <Link href={`/admin/agencies/${agency.id}`} className="text-sm font-medium underline">
          Command center
        </Link>
      }
    >
      <div className="w-full space-y-4">
        <AdminPanel title="Filter">
          <label className={cn("text-sm font-medium", adminMutedSoft)}>
            Status
            <AdminSelect
              className="mt-1.5 max-w-xs"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending approval</option>
              <option value="scheduled">Scheduled</option>
              <option value="paid">Paid</option>
              <option value="held">Held</option>
              <option value="failed">Failed</option>
            </AdminSelect>
          </label>
        </AdminPanel>

        <AdminPanel title="Batches" hint={`${batches.length} shown · commission excludes deposit`}>
          {batches.length === 0 ? (
            <p className={cn("text-sm", adminMuted)}>No batches for this filter.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {batches.map((p) => (
                <li
                  key={p.id}
                  className="rounded-[8px] border border-zinc-200 px-3 py-3 dark:border-zinc-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{p.periodLabel}</span>
                    <AdminChip>{p.status.replaceAll("_", " ")}</AdminChip>
                  </div>
                  <p className={cn("mt-2 font-mono tabular-nums", adminMuted)}>
                    Net {formatAdminTnd(p.netPayableTnd)} · Fee{" "}
                    {formatAdminTnd(p.commissionTnd)} · Listed{" "}
                    {formatAdminTnd(p.listedTotalTnd)}
                  </p>
                  {p.holdReason ? (
                    <p className="mt-1 text-xs text-amber-900 dark:text-amber-200">
                      Hold: {p.holdReason}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
