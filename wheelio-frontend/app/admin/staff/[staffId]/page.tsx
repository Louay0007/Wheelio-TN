"use client"

import { useParams } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { roleLabel } from "@/lib/admin"

export default function AdminStaffDetailPage() {
  const { staffId } = useParams<{ staffId: string }>()
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Staff member">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const member = workspace.staff.find((s) => s.id === staffId)

  if (!member) {
    return (
      <AdminShell title="Staff not found">
        <AdminLinkButton href="/admin/staff" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title={member.name}
      description={member.email}
      actions={
        <AdminLinkButton href="/admin/staff" variant="secondary">
          All staff
        </AdminLinkButton>
      }
    >
      <AdminPanel className="max-w-lg">
        <AdminKeyValue
          rows={[
            { label: "Role", value: roleLabel(member.role) },
            {
              label: "Status",
              value: (
                <AdminChip tone={member.status === "active" ? "strong" : "neutral"}>
                  {member.status}
                </AdminChip>
              ),
            },
            { label: "Last active", value: member.lastActiveLabel },
          ]}
        />
      </AdminPanel>
    </AdminShell>
  )
}
