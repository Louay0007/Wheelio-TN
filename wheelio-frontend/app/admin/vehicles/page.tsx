"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminVehiclesPage() {
  const { workspace, session, ready, updateWorkspace } = useAdminSession()

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Vehicles">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const flagged = workspace.vehicles.filter(
    (v) => v.flags.length > 0 || v.forceHidden,
  )

  const actorName = session.name

  function toggleHide(id: string) {
    const actor = actorName
    updateWorkspace((ws) => {
      if (!ws) return ws
      const v = ws.vehicles.find((x) => x.id === id)
      if (!v) return ws
      const nextHidden = !v.forceHidden
      return pushAudit(
        {
          ...ws,
          vehicles: ws.vehicles.map((x) =>
            x.id === id ? { ...x, forceHidden: nextHidden } : x,
          ),
        },
        actor,
        nextHidden ? "Force hide vehicle" : "Restore vehicle visibility",
        `Vehicle ${id}`,
      )
    })
  }

  return (
    <AdminShell
      title="Vehicle QA queue"
      description="Cross-agency flags. Force hide removes listing from search until agency fixes."
    >
      <div className="space-y-4">
        <AdminPanel title="Queue" hint={`${flagged.length} need attention`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className={cn("text-[11px] uppercase tracking-wide dark:border-zinc-700", adminMutedSoft)}>
                  <th className="pb-2 pr-3 font-semibold">Plate</th>
                  <th className="pb-2 pr-3 font-semibold">Agency</th>
                  <th className="pb-2 pr-3 font-semibold">Flags</th>
                  <th className="pb-2 pr-3 font-semibold">Photos</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspace.vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/admin/vehicles/${v.id}`}
                        className="font-mono font-semibold underline underline-offset-4"
                      >
                        {v.plate}
                      </Link>
                      <p className={cn("text-xs", adminMuted)}>{v.makeModel}</p>
                    </td>
                    <td className="py-2.5 pr-3">{v.agencyName}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {v.flags.length === 0 ? (
                          <span className={adminMuted}>None</span>
                        ) : (
                          v.flags.map((f) => (
                            <AdminChip key={f} tone="warn">
                              {f}
                            </AdminChip>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums">{v.photoCount}</td>
                    <td className="py-2.5 pr-3">
                      {v.forceHidden ? (
                        <AdminChip tone="strong">Hidden</AdminChip>
                      ) : (
                        <AdminChip>Live</AdminChip>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-2">
                        <AdminSecondaryButton
                          type="button"
                          className="h-9 px-2.5 text-xs"
                          onClick={() => toggleHide(v.id)}
                        >
                          {v.forceHidden ? "Unhide" : "Force hide"}
                        </AdminSecondaryButton>
                        <AdminLinkButton
                          href={`/admin/vehicles/${v.id}`}
                          variant="secondary"
                          className="h-9 px-2.5 text-xs"
                        >
                          Open
                        </AdminLinkButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
        <AdminPrimaryButton type="button" disabled className="opacity-50">
          Bulk export (demo)
        </AdminPrimaryButton>
      </div>
    </AdminShell>
  )
}
