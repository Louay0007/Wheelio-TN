"use client"

import { AgencyShell } from "@/components/agency/agency-shell"
import { PasswordFields } from "@/components/account/password-fields"

export default function AgencySecurityPage() {
  return (
    <AgencyShell title="Security" description="Password & sessions. MFA later.">
      <form
        className="max-w-md space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          alert("Password updated (demo)")
        }}
      >
        <PasswordFields showConfirm showStrength />
        <button type="submit" className="h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
          Update password
        </button>
      </form>
      <div className="mt-8 rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-4 text-sm">
        <p className="font-semibold">Active sessions (demo)</p>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">Tunis · Chrome · This device</p>
      </div>
    </AgencyShell>
  )
}
