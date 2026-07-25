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
import { useAdminApiCases } from "@/lib/hooks/use-admin-api"
import { cn } from "@/lib/utils"

export default function AdminCasesPage() {
  const { workspace, ready } = useAdminSession()
  const api = useAdminApiCases()
  const [status, setStatus] = useState<string>("openish")

  const demoRows = useMemo(() => {
    if (!workspace) return []
    return workspace.cases
      .filter((c) => {
        if (status === "all") return true
        if (status === "openish") return c.status !== "resolved"
        return c.status === status
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }, [workspace, status])

  const apiRows = useMemo(() => {
    return (api.cases ?? [])
      .filter((c) => {
        if (status === "all") return true
        if (status === "openish") return c.status !== "resolved"
        return c.status === status
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }, [api.cases, status])

  const rows = api.enabled ? apiRows : demoRows
  const loading = api.enabled ? api.loading : !ready || !workspace

  return (
    <AdminShell
      title="Support cases"
      description="Work that is not yet a formal claim."
      actions={<AdminLinkButton href="/admin/cases/new">New case</AdminLinkButton>}
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
            aria-label="Filter cases"
          >
            <option value="openish">Open + waiting</option>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="waiting">Waiting</option>
            <option value="resolved">Resolved</option>
          </AdminSelect>

          {rows.length === 0 ? (
            <AdminEmpty
              title="No cases"
              body="Create a case from a booking or the New case button."
              action={
                <AdminLinkButton href="/admin/cases/new">New case</AdminLinkButton>
              }
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((c) => (
                <li key={c.id}>
                  <AdminPanel
                    action={
                      <AdminLinkButton href={`/admin/cases/${c.id}`}>
                        Open
                      </AdminLinkButton>
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{c.subject}</p>
                      <AdminChip
                        tone={c.priority === "high" ? "strong" : "neutral"}
                      >
                        {c.priority}
                      </AdminChip>
                      <AdminChip>{c.status}</AdminChip>
                    </div>
                    <p className={cn("mt-2 text-xs", adminMutedSoft)}>
                      Updated {new Date(c.updatedAt).toLocaleString()}
                      {"bookingId" in c && c.bookingId
                        ? ` · booking ${c.bookingId}`
                        : ""}
                    </p>
                    {!api.enabled && "tags" in c ? (
                      <p className={cn("mt-1 text-sm", adminMuted)}>
                        {(c as { tags?: string[] }).tags?.join(" · ")}
                      </p>
                    ) : null}
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
