"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminLinkButton, AdminPanel, adminMuted } from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd } from "@/lib/admin"

const LINKS = [
  { href: "/admin/settings/security", label: "Security", hint: "MFA, session, dual control" },
  { href: "/admin/feature-flags", label: "Feature flags", hint: "Non-production toggles" },
  { href: "/admin/audit", label: "Audit log", hint: "Immutable admin actions" },
  { href: "/admin/staff", label: "Staff", hint: "Roles and invites" },
]

export default function AdminSettingsPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Settings">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell title="Settings" description="Platform configuration for the admin control plane.">
      <AdminPanel title="Workspace defaults">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className={adminMuted}>Dual control threshold</dt>
            <dd className="font-mono font-semibold">
              {formatAdminTnd(workspace.dualControlThresholdTnd)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={adminMuted}>Default SLA hours</dt>
            <dd className="font-mono font-semibold">{workspace.defaultSlaHours}h</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={adminMuted}>Standard take rate</dt>
            <dd className="font-mono font-semibold">{workspace.takeRateStandard}%</dd>
          </div>
        </dl>
      </AdminPanel>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {LINKS.map((item) => (
          <AdminPanel key={item.href} title={item.label} hint={item.hint}>
            <AdminLinkButton href={item.href} variant="secondary">
              Open
            </AdminLinkButton>
          </AdminPanel>
        ))}
      </div>
    </AdminShell>
  )
}
