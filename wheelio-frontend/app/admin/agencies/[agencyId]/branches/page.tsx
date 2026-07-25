"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminPanel,
  AdminSecondaryButton,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findAgency, pushAudit } from "@/lib/admin"
import { cn } from "@/lib/utils"

type BranchRow = {
  id: string
  label: string
  status: string
  flagged: boolean
}

export default function AdminAgencyBranchesPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session, updateWorkspace } = useAdminSession()
  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )

  const initialBranches = useMemo((): BranchRow[] => {
    if (!agency) return []
    return Array.from({ length: agency.branchCount }, (_, i) => ({
      id: `${agency.id}-branch-${i + 1}`,
      label: i === 0 ? `${agency.city} main desk` : `Branch ${i + 1}`,
      status: agency.verification === "live" ? "Open" : "Setup",
      flagged: false,
    }))
  }, [agency])

  const [branches, setBranches] = useState<BranchRow[]>([])
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    setBranches(initialBranches)
  }, [initialBranches])

  if (!workspace || !session) {
    return (
      <AdminShell title="Branches">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!agency) {
    return (
      <AdminShell title="Branches">
        <p className="text-sm">Agency not found.</p>
      </AdminShell>
    )
  }

  const ag = agency
  const actor = session.name

  function toggleFlag(branchId: string) {
    const branch = branches.find((b) => b.id === branchId)
    if (!branch) return
    const nextFlagged = !branch.flagged
    setBranches((rows) =>
      rows.map((b) => (b.id === branchId ? { ...b, flagged: nextFlagged } : b)),
    )
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        ws,
        actor,
        nextFlagged ? `Branch flagged: ${branch.label}` : `Branch flag cleared: ${branch.label}`,
        ag.tradeName,
      )
    })
    setFlash(nextFlagged ? `Flagged ${branch.label} for review.` : `Cleared flag on ${branch.label}.`)
  }

  const display = branches.length ? branches : initialBranches

  return (
    <AdminShell
      title="Branches"
      description={agency.tradeName}
      actions={
        <Link href={`/admin/agencies/${agency.id}`} className="text-sm font-medium underline">
          Command center
        </Link>
      }
    >
      <div className="w-full space-y-4">
        {flash ? (
          <p className="text-sm text-zinc-800 dark:text-zinc-100" role="status">
            {flash}
          </p>
        ) : null}
        <AdminPanel title="Locations" hint={`${display.length} from branchCount (read-only stub).`}>
          <ul className="space-y-2 text-sm">
            {display.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-zinc-200 px-3 py-2 dark:border-zinc-700"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{b.label}</span>
                  {b.flagged ? <AdminChip tone="warn">Flagged</AdminChip> : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(adminMutedSoft)}>{b.status}</span>
                  <AdminSecondaryButton type="button" onClick={() => toggleFlag(b.id)}>
                    {b.flagged ? "Clear flag" : "Flag"}
                  </AdminSecondaryButton>
                </div>
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
