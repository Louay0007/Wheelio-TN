"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminLinkButton,
  AdminPanel,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { roleNeedsMfa } from "@/lib/admin"

export default function AdminSettingsSecurityPage() {
  const { session, ready } = useAdminSession()

  if (!ready) {
    return (
      <AdminShell title="Security">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const mfaRequired = session ? roleNeedsMfa(session.role) : false

  return (
    <AdminShell
      title="Security"
      description="MFA and sensitive action gates for finance and super roles."
      actions={
        <AdminLinkButton href="/admin/settings" variant="secondary">
          Settings hub
        </AdminLinkButton>
      }
    >
      <AdminPanel title="Session MFA">
        {!session ? (
          <p className={`text-sm ${adminMuted}`}>
            <Link href="/admin/login" className="underline">
              Sign in
            </Link>{" "}
            to view MFA state.
          </p>
        ) : (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className={adminMuted}>Role</dt>
              <dd className="font-semibold">{session.role}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className={adminMuted}>MFA required</dt>
              <dd className="font-semibold">{mfaRequired ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className={adminMuted}>MFA ok this session</dt>
              <dd className="font-semibold">{session.mfaOk ? "Yes" : "No"}</dd>
            </div>
          </dl>
        )}
        <div className="mt-4">
          <AdminLinkButton href="/admin/mfa?next=/admin/settings/security" variant="secondary">
            Confirm MFA
          </AdminLinkButton>
        </div>
      </AdminPanel>

      <div className="mt-4">
        <AdminTip>
          Payout release and other money actions check session.mfaOk before proceeding.
        </AdminTip>
      </div>
    </AdminShell>
  )
}
