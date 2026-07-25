"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

export default function MemberPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const { workspace, updateWorkspace, session } = useAgencySession()
  const member = workspace?.staff.find((s) => s.id === memberId)
  if (!member) return <AgencyShell title="Member"><Link href="/agency/team">Back</Link></AgencyShell>
  return (
    <AgencyShell title={member.name} description={`${member.email} · ${member.role}`}>
      <p className="text-sm">Status: {member.status} · {member.lastActiveLabel}</p>
      {session?.role === "owner" && member.role !== "owner" ? (
        <button
          type="button"
          className="mt-4 h-11 cursor-pointer rounded-[8px] border border-zinc-300 dark:border-zinc-600 px-4 text-sm font-semibold"
          onClick={() =>
            updateWorkspace((ws) => {
              if (!ws) return ws
              return {
                ...ws,
                staff: ws.staff.map((s) =>
                  s.id === memberId ? { ...s, status: "disabled" } : s,
                ),
              }
            })
          }
        >
          Deactivate
        </button>
      ) : null}
    </AgencyShell>
  )
}
