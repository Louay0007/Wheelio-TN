"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyLinkButton,
  AgencyPanel,
  AgencyTip,
  agencyMuted,
  agencyMutedSoft,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { cn } from "@/lib/utils"

export default function TeamPage() {
  const { workspace, session, ready } = useAgencySession()
  const canInvite = session?.role === "owner"
  const owner = workspace?.staff.find((s) => s.role === "owner")

  return (
    <AgencyShell
      title="Staff"
      description="Who can answer bookings, edit cars, or see money."
      actions={
        canInvite ? (
          <AgencyLinkButton href="/agency/team/invite">Invite</AgencyLinkButton>
        ) : null
      }
    >
      {!ready || !workspace ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          {!canInvite ? (
            <AgencyTip>
              Only owners can invite. Ask {owner?.name ?? "your owner"} if you need
              access.
            </AgencyTip>
          ) : (
            <AgencyTip>
              Owners see everything. Agents mainly handle bookings. Accountants see
              payments.
            </AgencyTip>
          )}

          <ul className="space-y-3">
            {workspace.staff.map((s) => (
              <li key={s.id}>
                <AgencyPanel>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/agency/team/${s.id}`}
                        className="text-base font-semibold underline-offset-4 hover:underline"
                      >
                        {s.name}
                      </Link>
                      <p className={cn("mt-1 text-sm", agencyMuted)}>{s.email}</p>
                      <p
                        className={cn("mt-2 text-xs font-semibold uppercase tracking-[0.1em]",
                          agencyMutedSoft,
                        )}
                      >
                        {s.role} · {s.status}
                      </p>
                    </div>
                    <p className={cn("text-sm", agencyMuted)}>
                      Last active {s.lastActiveLabel}
                    </p>
                  </div>
                </AgencyPanel>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AgencyShell>
  )
}
