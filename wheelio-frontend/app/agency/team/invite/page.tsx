"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { fieldInputClass } from "@/components/account/password-fields"
import type { AgencyRole } from "@/lib/agency"

export default function InvitePage() {
  const router = useRouter()
  const { session, updateWorkspace } = useAgencySession()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AgencyRole>("agent")

  if (session && session.role !== "owner") {
    return (
      <AgencyShell title="Invite">
        <p className="text-sm">You don’t have access. Ask the owner.</p>
      </AgencyShell>
    )
  }

  return (
    <AgencyShell title="Invite staff">
      <form
        className="max-w-md space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          updateWorkspace((ws) => {
            if (!ws) return ws
            return {
              ...ws,
              staff: [
                ...ws.staff,
                {
                  id: `st-${Date.now()}`,
                  name: email.split("@")[0] || "Invitee",
                  email,
                  role,
                  status: "invited",
                  lastActiveLabel: "Invite pending",
                },
              ],
            }
          })
          router.push("/agency/team")
        }}
      >
        <label className="block text-sm font-medium">Email<input type="email" required className={`${fieldInputClass} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm font-medium">Role
          <select className={`${fieldInputClass} mt-1`} value={role} onChange={(e) => setRole(e.target.value as AgencyRole)}>
            {["manager", "agent", "fleet", "accountant"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <p className="text-xs text-zinc-600 dark:text-zinc-300">Demo invite link: /agency/invite/demo-token</p>
        <button type="submit" className="h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">Send invite</button>
      </form>
    </AgencyShell>
  )
}
