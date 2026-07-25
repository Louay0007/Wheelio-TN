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
import { cn } from "@/lib/utils"

export default function AdminClaimsPage() {
  const { workspace, ready } = useAdminSession()
  const [status, setStatus] = useState("open")

  const rows = useMemo(() => {
    if (!workspace) return []
    return workspace.claims.filter((c) =>
      status === "all" ? true : c.status === status,
    )
  }, [workspace, status])

  return (
    <AdminShell
      title="Claims"
      description="Customer claims and agency issues in one queue."
    >
      {!ready || !workspace ? (
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          <AdminSelect
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="max-w-xs"
            aria-label="Filter claims"
          >
            <option value="open">Open</option>
            <option value="decided">Decided</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </AdminSelect>
          {rows.length === 0 ? (
            <AdminEmpty title="No claims" body="Claims appear from customer or agency submissions." />
          ) : (
            <ul className="space-y-3">
              {rows.map((c) => (
                <li key={c.id}>
                  <AdminPanel
                    action={
                      <AdminLinkButton href={`/admin/claims/${c.id}`}>
                        Decide
                      </AdminLinkButton>
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <p className="font-semibold">{c.type.replaceAll("_", " ")}</p>
                      <AdminChip>{c.status}</AdminChip>
                      <AdminChip>{c.source}</AdminChip>
                    </div>
                    <p className={cn("mt-1 text-sm", adminMuted)}>
                      {c.bookingRef} · {c.agencyName}
                    </p>
                    <p className={cn("mt-1 text-xs", adminMutedSoft)}>
                      Rent impact {formatAdminTnd(c.rentImpactTnd)} · Deposit at stake{" "}
                      {formatAdminTnd(c.depositAtStakeTnd)} (separate)
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
