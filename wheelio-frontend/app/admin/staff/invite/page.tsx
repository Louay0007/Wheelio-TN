"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminField,
  AdminInput,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSelect,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit, type AdminRole, type AdminStaffMember } from "@/lib/admin"

export default function AdminStaffInvitePage() {
  const router = useRouter()
  const { session, ready, updateWorkspace } = useAdminSession()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<AdminRole>("support")

  if (!ready || !session) {
    return (
      <AdminShell title="Invite staff">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const actorName = session.name

  function invite() {
    const id = `adm-${Date.now()}`
    const member: AdminStaffMember = {
      id,
      name: name.trim() || "Invited user",
      email: email.trim().toLowerCase() || "invite@wheelio.tn",
      role,
      status: "invited",
      lastActiveLabel: "Never",
    }
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        { ...ws, staff: [...ws.staff, member] },
        actorName,
        "Invited staff",
        member.email,
      )
    })
    router.push(`/admin/staff/${id}`)
  }

  return (
    <AdminShell
      title="Invite staff"
      actions={
        <AdminLinkButton href="/admin/staff" variant="secondary">
          Back
        </AdminLinkButton>
      }
    >
      <AdminPanel className="max-w-lg">
        <AdminField label="Full name">
          <AdminInput value={name} onChange={(e) => setName(e.target.value)} />
        </AdminField>
        <AdminField label="Work email">
          <AdminInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </AdminField>
        <AdminField label="Role">
          <AdminSelect value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
            <option value="super">Super</option>
            <option value="finance">Finance</option>
            <option value="partner_success">Partner success</option>
            <option value="support">Support</option>
            <option value="content">Content</option>
            <option value="readonly_analyst">Analyst</option>
          </AdminSelect>
        </AdminField>
        <AdminPrimaryButton type="button" className="mt-4" onClick={invite}>
          Send invite (demo)
        </AdminPrimaryButton>
      </AdminPanel>
    </AdminShell>
  )
}
