"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyLinkButton,
  AgencyPanel,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { useAgencyApiBranches } from "@/lib/hooks/use-agency-api-ops"
import { cn } from "@/lib/utils"

export default function BranchesPage() {
  const { workspace, ready, branchId, setSelectedBranch } = useAgencySession()
  const api = useAgencyApiBranches()

  return (
    <AgencyShell
      title="Desks & branches"
      description="Pickup desks and delivery hubs your customers can choose."
      actions={
        <AgencyLinkButton href="/agency/branches/new">Add desk</AgencyLinkButton>
      }
    >
      {(api.enabled ? api.loading : !ready || !workspace) ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          {api.error ? (
            <p className="text-sm text-red-600" role="alert">
              {api.error}
            </p>
          ) : null}
          <AgencyTip>
            Use the Desk filter in the header to focus Home, Inbox, and Bookings on
            one location.
          </AgencyTip>
          <ul className="space-y-3">
            {api.enabled
              ? (api.items ?? []).map((b) => {
                  const selected = branchId === b.id
                  return (
                    <li key={b.id}>
                      <AgencyPanel
                        action={
                          <button
                            type="button"
                            className={cn(
                              "h-10 cursor-pointer rounded-[8px] border px-3 text-sm font-semibold",
                              selected
                                ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                                : "border-zinc-300 text-zinc-900 dark:border-zinc-600 dark:text-zinc-100",
                            )}
                            onClick={() =>
                              setSelectedBranch(selected ? "all" : b.id)
                            }
                          >
                            {selected ? "Filtering here" : "Filter to this desk"}
                          </button>
                        }
                      >
                        <Link
                          href={`/agency/branches/${b.id}`}
                          className="text-base font-semibold underline-offset-4 hover:underline"
                        >
                          {b.name}
                        </Link>
                        <p className={cn("mt-1 text-sm", agencyMuted)}>
                          {b.city} · {b.active ? "Active" : "Inactive"}
                        </p>
                      </AgencyPanel>
                    </li>
                  )
                })
              : workspace!.branches.map((b) => {
                  const selected = branchId === b.id
                  return (
                    <li key={b.id}>
                      <AgencyPanel
                        action={
                          <button
                            type="button"
                            className={cn(
                              "h-10 cursor-pointer rounded-[8px] border px-3 text-sm font-semibold",
                              selected
                                ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                                : "border-zinc-300 text-zinc-900 dark:border-zinc-600 dark:text-zinc-100",
                            )}
                            onClick={() =>
                              setSelectedBranch(selected ? "all" : b.id)
                            }
                          >
                            {selected ? "Filtering here" : "Filter to this desk"}
                          </button>
                        }
                      >
                        <Link
                          href={`/agency/branches/${b.id}`}
                          className="text-base font-semibold underline-offset-4 hover:underline"
                        >
                          {b.name}
                        </Link>
                        <p className={cn("mt-1 text-sm", agencyMuted)}>
                          {b.city} · {b.address}
                        </p>
                      </AgencyPanel>
                    </li>
                  )
                })}
          </ul>
        </div>
      )}
    </AgencyShell>
  )
}
