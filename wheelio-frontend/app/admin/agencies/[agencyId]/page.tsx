"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { DualControlPendingBanner } from "@/components/admin/dual-control-panel"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminAuditStrip,
  AdminChip,
  AdminField,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminSelect,
  AdminStat,
  AdminTextarea,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import {
  syncAgencyInstant,
  syncAgencyVerification,
} from "@/lib/admin-agency-sync"
import {
  addDualControlRequest,
  pendingDualForEntity,
} from "@/lib/admin-dual-control"
import { useAdminSession } from "@/lib/admin-session"
import {
  findAgency,
  formatAdminTnd,
  pushAudit,
  verificationLabel,
  type AgencyVerification,
  type CommissionTier,
} from "@/lib/admin"
import { startPreview } from "@/lib/preview-mode"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

const SUBLINKS = (id: string) => [
  { href: `/admin/agencies/${id}/documents`, label: "Documents" },
  { href: `/admin/agencies/${id}/contract`, label: "Contract" },
  { href: `/admin/agencies/${id}/quality`, label: "Quality" },
  { href: `/admin/agencies/${id}/branches`, label: "Branches" },
  { href: `/admin/agencies/${id}/fleet`, label: "Fleet" },
  { href: `/admin/agencies/${id}/rates`, label: "Rates" },
  { href: `/admin/agencies/${id}/payouts`, label: "Payouts" },
  { href: `/admin/agencies/${id}/staff`, label: "Staff" },
  { href: `/admin/agencies/${id}/notes`, label: "Notes" },
]

const TIER_TAKE: Record<CommissionTier, 10 | 12> = {
  launch: 10,
  standard: 12,
  volume: 10,
}

export default function AdminAgencyCommandPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session, updateWorkspace } = useAdminSession()
  const { t } = useLocale()
  const [reason, setReason] = useState("")
  const [pendingVerification, setPendingVerification] = useState<AgencyVerification | null>(
    null,
  )
  const [tierDraft, setTierDraft] = useState<CommissionTier | "">("")
  const [flash, setFlash] = useState<string | null>(null)

  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )

  const payouts = useMemo(
    () => workspace?.payoutBatches.filter((p) => p.agencyId === agency?.id) ?? [],
    [workspace, agency],
  )

  const auditForAgency = useMemo(() => {
    if (!workspace || !agency) return []
    return workspace.audit.filter((e) => e.entity.includes(agency.tradeName))
  }, [workspace, agency])

  if (!workspace || !session) {
    return (
      <AdminShell title="Agency">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!agency) {
    return (
      <AdminShell title="Agency not found">
        <AdminTip>
          <Link href="/admin/agencies" className="underline">
            Back to directory
          </Link>
        </AdminTip>
      </AdminShell>
    )
  }

  const actor = session.name
  const ag = agency
  const pendingSuspend = pendingDualForEntity(workspace, `agency-suspend:${ag.id}`)
  const pendingTier = pendingDualForEntity(workspace, `agency-tier:${ag.id}`)

  function setVerification(next: AgencyVerification) {
    if (!reason.trim()) {
      setFlash("Add a reason before changing verification.")
      return
    }
    if (next === "suspended") {
      if (pendingSuspend) {
        setFlash("Suspend already waiting on a second approver.")
        return
      }
      updateWorkspace((ws) => {
        if (!ws) return ws
        return pushAudit(
          addDualControlRequest(ws, {
            kind: "agency_suspend",
            entity: `agency-suspend:${ag.id}`,
            summary: `Suspend ${ag.tradeName}: ${reason.trim()}`,
            payload: {
              agencyId: ag.id,
              verification: "suspended",
              reason: reason.trim(),
            },
            requestedBy: actor,
            requestedByStaffId: session!.staffId,
          }),
          actor,
          `Suspend submitted for dual-control (${reason.trim()})`,
          ag.tradeName,
        )
      })
      setPendingVerification(null)
      setReason("")
      setFlash(t("dual.requestBody"))
      return
    }

    updateWorkspace((ws) => {
      if (!ws) return ws
      let updated: typeof ws = {
        ...ws,
        agencies: ws.agencies.map((a) =>
          a.id === ag.id
            ? {
                ...a,
                verification: next,
                publicVisible: next === "live",
              }
            : a,
        ),
      }
      updated = pushAudit(
        updated,
        actor,
        `Verification → ${next} (${reason.trim()})`,
        ag.tradeName,
      )
      return updated
    })
    syncAgencyVerification({
      agencyId: ag.id,
      verification:
        next === "live" ? "live" : next === "paused" ? "paused" : "suspended",
      publicVisible: next === "live",
    })
    setPendingVerification(null)
    setReason("")
    setFlash(`Verification set to ${verificationLabel(next)}. Agency portal synced.`)
  }

  function toggleInstant(enable: boolean) {
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
    syncAgencyInstant({ agencyId: ag.id, instantEnabled: enable })
    setReason("")
    setFlash(
      enable
        ? "Instant booking enabled. Agency portal synced."
        : "Instant locked. Agency portal synced.",
    )
  }

  function submitTier() {
    if (!tierDraft) {
      setFlash("Choose a commission tier.")
      return
    }
    if (!reason.trim()) {
      setFlash("Add a reason before changing tier.")
      return
    }
    if (pendingTier) {
      setFlash("Tier change already waiting on a second approver.")
      return
    }
    const take = TIER_TAKE[tierDraft]
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        addDualControlRequest(ws, {
          kind: "tier_change",
          entity: `agency-tier:${ag.id}`,
          summary: `Tier ${ag.tradeName} → ${tierDraft} (${take}%)`,
          payload: {
            agencyId: ag.id,
            tier: tierDraft,
            takeRatePercent: take,
            reason: reason.trim(),
          },
          requestedBy: actor,
          requestedByStaffId: session!.staffId,
        }),
        actor,
        `Tier change submitted for dual-control`,
        ag.tradeName,
      )
    })
    setReason("")
    setTierDraft("")
    setFlash(t("dual.requestBody"))
  }

  const netOpen = payouts
    .filter((p) => !["paid", "failed"].includes(p.status))
    .reduce((s, p) => s + p.netPayableTnd, 0)

  return (
    <AdminShell
      title={agency.tradeName}
      description={`${agency.city} · ${verificationLabel(agency.verification)}`}
      actions={
        <>
          <AdminLinkButton href={`/agencies/${agency.slug}`} variant="secondary">
            Public profile
          </AdminLinkButton>
          <AdminSecondaryButton
            type="button"
            onClick={() => {
              startPreview({
                as: "agency",
                label: agency.tradeName,
                returnTo: `/admin/agencies/${agency.id}`,
              })
              window.location.href = "/agency"
            }}
          >
            Agency portal preview
          </AdminSecondaryButton>
        </>
      }
    >
      <div className="w-full space-y-4">
        {flash ? (
          <p className="text-sm text-zinc-800 dark:text-zinc-100" role="status">
            {flash}
          </p>
        ) : null}

        <DualControlPendingBanner pending={pendingSuspend} />
        <DualControlPendingBanner pending={pendingTier} />

        <div className="flex flex-wrap gap-2">
          {SUBLINKS(agency.id).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-[8px] border border-zinc-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <AdminPanel title="Contacts">
          <AdminKeyValue
            rows={[
              { label: "Legal name", value: agency.legalName },
              { label: "Email", value: agency.email },
              { label: "Phone", value: agency.phone },
              { label: "Slug", value: agency.slug },
              {
                label: "Verification",
                value: (
                  <AdminChip tone={agency.verification === "live" ? "strong" : "neutral"}>
                    {verificationLabel(agency.verification)}
                  </AdminChip>
                ),
              },
              {
                label: "Commission tier",
                value: `${agency.commissionTier} · ${agency.takeRatePercent}%`,
              },
            ]}
          />
        </AdminPanel>

        <AdminPanel title="Verification" hint="Live/Pause sync immediately. Suspend needs dual-control.">
          <div className="space-y-3">
            <AdminField label="Reason">
              <AdminTextarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Customer-visible impact note for audit…"
              />
            </AdminField>
            <div className="flex flex-wrap gap-2">
              {(["live", "paused", "suspended"] as AgencyVerification[]).map((v) => (
                <AdminSecondaryButton
                  key={v}
                  type="button"
                  onClick={() => setPendingVerification(v)}
                  disabled={agency.verification === v || (v === "suspended" && Boolean(pendingSuspend))}
                >
                  {verificationLabel(v)}
                  {v === "suspended" ? " (dual)" : ""}
                </AdminSecondaryButton>
              ))}
            </div>
            {pendingVerification ? (
              <div className="rounded-[8px] border border-zinc-300 p-3 dark:border-zinc-600">
                <p className="text-sm font-medium">
                  Confirm {verificationLabel(pendingVerification)}?
                </p>
                <div className="mt-2 flex gap-2">
                  <AdminPrimaryButton
                    type="button"
                    onClick={() => setVerification(pendingVerification)}
                  >
                    Confirm
                  </AdminPrimaryButton>
                  <AdminSecondaryButton
                    type="button"
                    onClick={() => setPendingVerification(null)}
                  >
                    Cancel
                  </AdminSecondaryButton>
                </div>
              </div>
            ) : null}
          </div>
        </AdminPanel>

        <AdminPanel title="Commission tier" hint="Tier changes always require a second signer.">
          <AdminField label="New tier">
            <AdminSelect
              value={tierDraft}
              onChange={(e) => setTierDraft(e.target.value as CommissionTier | "")}
            >
              <option value="">Select…</option>
              <option value="launch">Launch (10%)</option>
              <option value="standard">Standard (12%)</option>
              <option value="volume">Volume (10%)</option>
            </AdminSelect>
          </AdminField>
          <div className="mt-3">
            <AdminPrimaryButton
              type="button"
              onClick={submitTier}
              disabled={Boolean(pendingTier)}
            >
              {t("dual.submit")}
            </AdminPrimaryButton>
          </div>
          {!pendingTier && agency.commissionTier ? (
            <p className={cn("mt-2 text-xs", adminMuted)}>
              Current {agency.commissionTier}. Approval syncs{" "}
              <code className="font-mono">wheelio-agency-workspace</code>.
            </p>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Instant booking" hint="Reason required. Syncs agency booking mode.">
          <p className={cn("text-sm", adminMuted)}>
            Quality score {agency.qualityScore}. Acceptance {agency.acceptanceRate}%. Response{" "}
            {agency.avgResponseHours}h median.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {agency.instantEnabled ? (
              <AdminSecondaryButton type="button" onClick={() => toggleInstant(false)}>
                Lock Instant
              </AdminSecondaryButton>
            ) : (
              <AdminPrimaryButton type="button" onClick={() => toggleInstant(true)}>
                Unlock Instant
              </AdminPrimaryButton>
            )}
            <AdminLinkButton href={`/admin/agencies/${agency.id}/quality`} variant="secondary">
              Quality detail
            </AdminLinkButton>
          </div>
        </AdminPanel>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStat label="Quality score" value={String(agency.qualityScore)} />
          <AdminStat label="GMV 30d" value={formatAdminTnd(agency.gmv30dTnd)} />
          <AdminStat label="Open SLA breaches" value={String(agency.openSlaBreaches)} />
          <AdminStat
            label="Open payout net"
            value={formatAdminTnd(netOpen)}
            href={`/admin/agencies/${agency.id}/payouts`}
          />
        </div>

        <AdminPanel title="Money snapshot" hint="Commission from trip totals. Deposit excluded.">
          <AdminTip>
            Take rate {agency.takeRatePercent}% on customer listed trip total. Banking ending{" "}
            {agency.ibanLast4} (read-only in demo).
          </AdminTip>
          <ul className="mt-3 space-y-2 text-sm">
            {payouts.slice(0, 3).map((p) => (
              <li key={p.id} className="flex justify-between gap-4">
                <span>{p.periodLabel}</span>
                <span className="font-mono tabular-nums">
                  {formatAdminTnd(p.netPayableTnd)} · {p.status.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminAuditStrip
          entries={auditForAgency.length ? auditForAgency : workspace.audit.slice(0, 4)}
        />
      </div>
    </AdminShell>
  )
}
