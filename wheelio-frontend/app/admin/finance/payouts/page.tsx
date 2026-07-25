"use client"

import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminEmpty,
  AdminLinkButton,
  AdminPanel,
  AdminSelect,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd } from "@/lib/admin"
import { millimesToTnd } from "@/lib/gateways/agency"
import { useAdminApiPayouts } from "@/lib/hooks/use-admin-api"
import { cn } from "@/lib/utils"

export default function AdminPayoutsPage() {
  const { workspace, ready } = useAdminSession()
  const api = useAdminApiPayouts()
  const [status, setStatus] = useState("open")

  const demoRows = useMemo(() => {
    if (!workspace) return []
    return workspace.payoutBatches.filter((p) => {
      if (status === "all") return true
      if (status === "open")
        return ["draft", "pending_approval", "scheduled", "held"].includes(
          p.status,
        )
      return p.status === status
    })
  }, [workspace, status])

  const apiRows = useMemo(() => {
    return (api.payouts ?? []).filter((p) => {
      if (status === "all") return true
      if (status === "open")
        return ["draft", "pending_approval", "scheduled", "held"].includes(
          p.status,
        )
      return p.status === status
    })
  }, [api.payouts, status])

  const loading = api.enabled ? api.loading : !ready || !workspace

  return (
    <AdminShell
      title="Payout batches"
      description="Create, hold, and release agency payouts. Deposit never included."
      actions={
        <AdminLinkButton href="/admin/finance/payouts/new">
          New batch
        </AdminLinkButton>
      }
    >
      {loading ? (
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          {api.error ? (
            <p className="text-sm text-red-600" role="alert">
              {api.error}
            </p>
          ) : null}
          <AdminSelect
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="max-w-xs"
          >
            <option value="open">Needs action</option>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending approval</option>
            <option value="scheduled">Scheduled</option>
            <option value="paid">Paid</option>
            <option value="held">Held</option>
            <option value="failed">Failed</option>
          </AdminSelect>
          {(api.enabled ? apiRows : demoRows).length === 0 ? (
            <AdminEmpty
              title="No batches"
              body="Create a batch from completed trips not yet paid."
              action={
                <AdminLinkButton href="/admin/finance/payouts/new">
                  New batch
                </AdminLinkButton>
              }
            />
          ) : api.enabled ? (
            <ul className="space-y-3">
              {apiRows.map((p) => (
                <li key={p.id}>
                  <AdminPanel
                    action={
                      <AdminLinkButton href={`/admin/finance/payouts/${p.id}`}>
                        Open
                      </AdminLinkButton>
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <p className="font-semibold">{p.agencyId}</p>
                      <AdminChip>{p.status}</AdminChip>
                      <AdminChip tone="strong">includesDeposit=false</AdminChip>
                    </div>
                    <p className={cn("mt-2 font-mono text-sm", adminMuted)}>
                      {formatAdminTnd(millimesToTnd(p.totalMillimes))}
                    </p>
                  </AdminPanel>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-3">
              {demoRows.map((p) => (
                <li key={p.id}>
                  <AdminPanel
                    action={
                      <AdminLinkButton href={`/admin/finance/payouts/${p.id}`}>
                        Open
                      </AdminLinkButton>
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <p className="font-semibold">{p.agencyName}</p>
                      <AdminChip>{p.status}</AdminChip>
                    </div>
                    <p className={cn("mt-2 text-sm", adminMutedSoft)}>
                      {p.periodLabel}
                    </p>
                    <p className={cn("mt-1 font-mono text-sm", adminMuted)}>
                      {formatAdminTnd(p.netPayableTnd)}
                    </p>
                  </AdminPanel>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AdminShell>
  )
}
