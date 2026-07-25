"use client"

import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminField,
  AdminInput,
  AdminPanel,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { cn } from "@/lib/utils"

export default function AdminAuditPage() {
  const { workspace, ready } = useAdminSession()
  const [actorFilter, setActorFilter] = useState("")
  const [query, setQuery] = useState("")

  const entries = useMemo(() => {
    if (!workspace) return []
    return workspace.audit.filter((e) => {
      if (actorFilter && !e.actor.toLowerCase().includes(actorFilter.toLowerCase())) {
        return false
      }
      if (query) {
        const q = query.toLowerCase()
        return (
          e.action.toLowerCase().includes(q) ||
          e.entity.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [workspace, actorFilter, query])

  if (!ready || !workspace) {
    return (
      <AdminShell title="Audit">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Audit log"
      description="Immutable trail from workspace.audit. New rows prepend on sensitive actions."
    >
      <AdminPanel title="Filters">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Actor contains">
            <AdminInput
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="Louay"
            />
          </AdminField>
          <AdminField label="Search action or entity">
            <AdminInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Payout, promotion..."
            />
          </AdminField>
        </div>
      </AdminPanel>

      <AdminPanel className="mt-4" title={`${entries.length} entries`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr
                className={cn("text-[11px] uppercase tracking-wide dark:border-zinc-700",
                  adminMutedSoft,
                )}
              >
                <th className="pb-2 pr-3 font-semibold">When</th>
                <th className="pb-2 pr-3 font-semibold">Actor</th>
                <th className="pb-2 pr-3 font-semibold">Action</th>
                <th className="pb-2 font-semibold">Entity</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className={`py-2.5 pr-3 font-mono text-xs ${adminMuted}`}>
                    {new Date(e.at).toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3 font-medium">{e.actor}</td>
                  <td className="py-2.5 pr-3">{e.action}</td>
                  <td className={`py-2.5 font-mono text-xs ${adminMuted}`}>{e.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 ? (
          <p className={`mt-3 text-sm ${adminMuted}`}>No rows match filters.</p>
        ) : null}
      </AdminPanel>
    </AdminShell>
  )
}
