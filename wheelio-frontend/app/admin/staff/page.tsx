"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminLinkButton,
  AdminPanel,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { roleLabel } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminStaffPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Staff">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Staff"
      description="Internal Wheelio operators. Roles gate finance and content writes."
      actions={<AdminLinkButton href="/admin/staff/invite">Invite</AdminLinkButton>}
    >
      <AdminPanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr
                className={cn("text-[11px] uppercase tracking-wide dark:border-zinc-700",
                  adminMutedSoft,
                )}
              >
                <th className="pb-2 pr-3 font-semibold">Name</th>
                <th className="pb-2 pr-3 font-semibold">Email</th>
                <th className="pb-2 pr-3 font-semibold">Role</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {workspace.staff.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/admin/staff/${s.id}`}
                      className="font-semibold underline underline-offset-4"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{s.email}</td>
                  <td className="py-2.5 pr-3">{roleLabel(s.role)}</td>
                  <td className="py-2.5">
                    <AdminChip tone={s.status === "active" ? "strong" : "neutral"}>
                      {s.status}
                    </AdminChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
