"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminAuditStrip,
  AdminField,
  AdminPanel,
  AdminPrimaryButton,
  AdminTextarea,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findAgency, pushAudit } from "@/lib/admin"
import { cn } from "@/lib/utils"

function notesKey(agencyId: string) {
  return `wheelio-admin-agency-notes-${agencyId}`
}

export default function AdminAgencyNotesPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session, updateWorkspace } = useAdminSession()
  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )
  const [notes, setNotes] = useState("")
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !agency) return
    const raw = localStorage.getItem(notesKey(agency.id))
    if (raw) setNotes(raw)
  }, [agency])

  const auditForAgency = useMemo(() => {
    if (!workspace || !agency) return []
    return workspace.audit.filter((e) => e.entity.includes(agency.tradeName))
  }, [workspace, agency])

  if (!workspace || !session) {
    return (
      <AdminShell title="Notes">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!agency) {
    return (
      <AdminShell title="Notes">
        <p className="text-sm">Agency not found.</p>
      </AdminShell>
    )
  }

  const ag = agency
  const actor = session.name

  function save() {
    localStorage.setItem(notesKey(ag.id), notes)
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        ws,
        actor,
        notes.trim()
          ? `Internal notes updated (${notes.trim().slice(0, 80)}${notes.trim().length > 80 ? "…" : ""})`
          : "Internal notes cleared",
        ag.tradeName,
      )
    })
    setSavedAt(new Date().toLocaleTimeString())
  }

  return (
    <AdminShell
      title="Internal notes"
      description={`Partner success only · ${agency.tradeName}`}
      actions={
        <Link href={`/admin/agencies/${agency.id}`} className="text-sm font-medium underline">
          Command center
        </Link>
      }
    >
      <div className="w-full space-y-4">
        <AdminPanel title="Scratchpad" hint="Stored in this browser only (demo). Saved actions audit.">
          <AdminField label="Notes">
            <AdminTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Coaching, escalation context, call summaries…"
              rows={8}
            />
          </AdminField>
          <div className="mt-3 flex items-center gap-3">
            <AdminPrimaryButton type="button" onClick={save}>
              Save locally
            </AdminPrimaryButton>
            {savedAt ? (
              <span className={cn("text-xs", adminMuted)} role="status">
                Saved at {savedAt}
              </span>
            ) : null}
          </div>
        </AdminPanel>

        <AdminAuditStrip entries={auditForAgency.length ? auditForAgency : workspace.audit.slice(0, 4)} />
      </div>
    </AdminShell>
  )
}
