"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminAuditStrip,
  AdminChip,
  AdminField,
  AdminKeyValue,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminStat,
  AdminTextarea,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findAgency, pushAudit } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminAgencyQualityPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session, updateWorkspace } = useAdminSession()
  const [reason, setReason] = useState("")
  const [pendingInstant, setPendingInstant] = useState<boolean | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )

  const auditForAgency = useMemo(() => {
    if (!workspace || !agency) return []
    return workspace.audit.filter((e) => e.entity.includes(agency.tradeName))
  }, [workspace, agency])

  if (!workspace || !session) {
    return (
      <AdminShell title="Quality">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!agency) {
    return (
      <AdminShell title="Quality">
        <AdminTip>
          <Link href="/admin/agencies" className="underline">
            Back to directory
          </Link>
        </AdminTip>
      </AdminShell>
    )
  }

  const gates = [
    {
      label: "Acceptance rate",
      value: `${agency.acceptanceRate}%`,
      target: "≥ 85%",
      ok: agency.acceptanceRate >= 85,
    },
    {
      label: "Median response",
      value: `${agency.avgResponseHours}h`,
      target: "≤ 4h",
      ok: agency.avgResponseHours <= 4,
    },
    {
      label: "Quality score",
      value: String(agency.qualityScore),
      target: "≥ 70",
      ok: agency.qualityScore >= 70,
    },
    {
      label: "Open SLA breaches",
      value: String(agency.openSlaBreaches),
      target: "0",
      ok: agency.openSlaBreaches === 0,
    },
  ]

  const recommended =
    !agency.instantEnabled && gates.every((g) => g.ok)
      ? "Unlock Instant when partner success confirms supply."
      : agency.openSlaBreaches > 0
        ? "Coach on SLA. Consider request-to-book only."
        : "Monitor weekly. No mandatory action."

  const ag = agency
  const actor = session.name

  function applyInstant(enable: boolean) {
    if (!reason.trim()) {
      setFlash("Add a reason before changing Instant booking.")
      return
    }
    updateWorkspace((ws) => {
      if (!ws) return ws
      let updated: typeof ws = {
        ...ws,
        agencies: ws.agencies.map((a) =>
          a.id === ag.id ? { ...a, instantEnabled: enable } : a,
        ),
      }
      updated = pushAudit(
        updated,
        actor,
        enable
          ? `Instant unlocked (${reason.trim()})`
          : `Instant locked (${reason.trim()})`,
        ag.tradeName,
      )
      return updated
    })
    setPendingInstant(null)
    setReason("")
    setFlash(enable ? "Instant booking enabled." : "Instant locked. Request-to-book only.")
  }

  return (
    <AdminShell
      title="Quality and Instant gates"
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStat label="Quality score" value={String(agency.qualityScore)} />
          <AdminStat label="Acceptance" value={`${agency.acceptanceRate}%`} />
          <AdminStat label="Response median" value={`${agency.avgResponseHours}h`} />
          <AdminStat label="SLA breaches" value={String(agency.openSlaBreaches)} />
        </div>

        <AdminPanel title="Scorecard">
          <AdminKeyValue
            rows={gates.map((g) => ({
              label: g.label,
              value: (
                <span className={g.ok ? "" : "font-semibold text-zinc-900 dark:text-zinc-100"}>
                  {g.value} (target {g.target})
                </span>
              ),
            }))}
          />
        </AdminPanel>

        <AdminPanel title="Instant booking" hint="Reason required to lock or unlock.">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={cn("text-sm", adminMuted)}>Current mode</span>
            <AdminChip tone={agency.instantEnabled ? "strong" : "neutral"}>
              {agency.instantEnabled ? "Instant on" : "Request to book"}
            </AdminChip>
          </div>
          <AdminField label="Reason">
            <AdminTextarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why Instant is being changed for this partner…"
            />
          </AdminField>
          <div className="mt-3 flex flex-wrap gap-2">
            {agency.instantEnabled ? (
              <AdminSecondaryButton type="button" onClick={() => setPendingInstant(false)}>
                Lock Instant
              </AdminSecondaryButton>
            ) : (
              <AdminPrimaryButton type="button" onClick={() => setPendingInstant(true)}>
                Unlock Instant
              </AdminPrimaryButton>
            )}
          </div>
          {pendingInstant !== null ? (
            <div className="mt-3 rounded-[8px] border border-zinc-300 p-3 dark:border-zinc-600">
              <p className="text-sm font-medium">
                Confirm {pendingInstant ? "unlock" : "lock"} Instant?
              </p>
              <div className="mt-2 flex gap-2">
                <AdminPrimaryButton type="button" onClick={() => applyInstant(pendingInstant)}>
                  Confirm
                </AdminPrimaryButton>
                <AdminSecondaryButton type="button" onClick={() => setPendingInstant(null)}>
                  Cancel
                </AdminSecondaryButton>
              </div>
            </div>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Recommended action">
          <p className="text-sm font-medium">{recommended}</p>
          <p className={cn("mt-2 text-sm", adminMuted)}>
            Instant badge on customer search follows these gates and admin Instant lock.
          </p>
        </AdminPanel>

        <AdminTip>
          Agency booking mode lives in agency settings. Pausing listings is a verification action on
          the command center.
        </AdminTip>

        <AdminAuditStrip entries={auditForAgency.length ? auditForAgency : workspace.audit.slice(0, 4)} />
      </div>
    </AdminShell>
  )
}
