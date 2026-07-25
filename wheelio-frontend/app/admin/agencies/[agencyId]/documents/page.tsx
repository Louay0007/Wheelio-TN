"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminPanel,
  AdminSecondaryButton,
  AdminTextarea,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findAgency, pushAudit } from "@/lib/admin"
import { cn } from "@/lib/utils"

const DEMO_DOCS = [
  "Company registration",
  "Tax ID",
  "Insurance",
  "Fleet authorization",
  "Signatory ID",
]

type DocState = "missing" | "uploaded" | "approved" | "rejected" | "expired"

export default function AdminAgencyDocumentsPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session, updateWorkspace } = useAdminSession()
  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )

  const [states, setStates] = useState<Record<string, DocState>>(() =>
    Object.fromEntries(DEMO_DOCS.map((d, i) => [d, i < 2 ? "approved" : i === 2 ? "uploaded" : "missing"])),
  )
  const [note, setNote] = useState("")

  if (!agency || !session) {
    return (
      <AdminShell title="Documents">
        <p className="text-sm">Agency not found.</p>
      </AdminShell>
    )
  }

  const ag = agency
  const actor = session.name

  function setState(label: string, state: DocState) {
    setStates((s) => ({ ...s, [label]: state }))
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(ws, actor, `Document ${state}: ${label}`, ag.tradeName)
    })
  }

  return (
    <AdminShell
      title="Document vault"
      description={agency.tradeName}
      actions={
        <Link
          href={`/admin/agencies/${agency.id}`}
          className="text-sm font-medium underline underline-offset-4"
        >
          Command center
        </Link>
      }
    >
      <div className="w-full space-y-4">
        <AdminPanel title="Compliance files" hint="Approve or reject with notes for onboarding.">
          <ul className="space-y-3">
            {DEMO_DOCS.map((label) => (
              <li
                key={label}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800"
              >
                <span className="text-sm font-medium">{label}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminChip tone={states[label] === "missing" ? "warn" : "neutral"}>
                    {states[label]}
                  </AdminChip>
                  <AdminSecondaryButton type="button" onClick={() => setState(label, "approved")}>
                    Approve
                  </AdminSecondaryButton>
                  <AdminSecondaryButton type="button" onClick={() => setState(label, "rejected")}>
                    Reject
                  </AdminSecondaryButton>
                </div>
              </li>
            ))}
          </ul>
          <label className="mt-4 block text-sm font-medium">
            Note to agency
            <AdminTextarea
              className="mt-1.5"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Visible on documents step…"
            />
          </label>
        </AdminPanel>
        <p className={cn("text-sm", adminMuted)}>
          Insurance expiry alerts would appear on Home at 30, 14, and 7 days (demo stub).
        </p>
      </div>
    </AdminShell>
  )
}
