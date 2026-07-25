"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { DualControlPendingBanner } from "@/components/admin/dual-control-panel"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminAuditStrip,
  AdminField,
  AdminInput,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { syncAgencyPayoutFromAdmin } from "@/lib/admin-agency-sync"
import {
  addDualControlRequest,
  pendingDualForEntity,
} from "@/lib/admin-dual-control"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd, pushAudit, roleCanWriteFinance } from "@/lib/admin"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

export default function AdminPayoutDetailPage() {
  const { payoutId } = useParams<{ payoutId: string }>()
  const router = useRouter()
  const { workspace, ready, session, updateWorkspace } = useAdminSession()
  const { t } = useLocale()
  const batch = workspace?.payoutBatches.find((p) => p.id === payoutId)
  const [holdReason, setHoldReason] = useState(batch?.holdReason ?? "")
  const [flash, setFlash] = useState<string | null>(null)

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Payout">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!batch) {
    return (
      <AdminShell title="Batch not found">
        <AdminLinkButton href="/admin/finance/payouts" variant="secondary">
          Back to payouts
        </AdminLinkButton>
      </AdminShell>
    )
  }

  const canWrite = roleCanWriteFinance(session.role)
  const batchId = batch.id
  const actorName = session.name
  const mfaOk = session.mfaOk
  const pending = pendingDualForEntity(workspace, `payout:${batchId}`)
  const needsDual =
    batch.netPayableTnd >= workspace.dualControlThresholdTnd ||
    batch.status === "held" ||
    batch.status === "pending_approval"

  function hold() {
    if (!canWrite || !holdReason.trim()) return
    updateWorkspace((ws) => {
      if (!ws) return ws
      const next = pushAudit(
        {
          ...ws,
          payoutBatches: ws.payoutBatches.map((p) =>
            p.id === batchId
              ? { ...p, status: "held" as const, holdReason: holdReason.trim() }
              : p,
          ),
        },
        actorName,
        "Payout held",
        batchId,
      )
      const row = next.payoutBatches.find((p) => p.id === batchId)
      if (row) {
        syncAgencyPayoutFromAdmin({
          agencyId: row.agencyId,
          payout: {
            id: row.id,
            periodLabel: row.periodLabel,
            netPayableTnd: row.netPayableTnd,
            commissionTnd: row.commissionTnd,
            listedTotalTnd: row.listedTotalTnd,
            status: row.status,
            ibanLast4: row.ibanLast4,
            bookingIds: row.bookingIds,
          },
        })
      }
      return next
    })
    setFlash("Hold placed and agency portal payout synced.")
  }

  function requestRelease() {
    if (!canWrite) return
    if (!mfaOk) {
      router.push(
        `/admin/mfa?next=${encodeURIComponent(`/admin/finance/payouts/${batchId}`)}`,
      )
      return
    }
    if (pending) {
      setFlash("Release already waiting on a second approver.")
      return
    }
    if (needsDual) {
      updateWorkspace((ws) => {
        if (!ws) return ws
        let next = addDualControlRequest(ws, {
          kind: "payout_release",
          entity: `payout:${batchId}`,
          summary: `Release ${batch!.periodLabel} · ${formatAdminTnd(batch!.netPayableTnd)} to ${batch!.agencyName}`,
          payload: { payoutId: batchId },
          requestedBy: actorName,
          requestedByStaffId: session!.staffId,
        })
        next = {
          ...next,
          payoutBatches: next.payoutBatches.map((p) =>
            p.id === batchId ? { ...p, status: "pending_approval" as const } : p,
          ),
        }
        return pushAudit(
          next,
          actorName,
          "Payout release submitted for dual-control",
          batchId,
        )
      })
      setFlash(t("dual.requestBody"))
      return
    }
    updateWorkspace((ws) => {
      if (!ws) return ws
      const next = pushAudit(
        {
          ...ws,
          payoutBatches: ws.payoutBatches.map((p) =>
            p.id === batchId
              ? { ...p, status: "scheduled" as const, holdReason: undefined }
              : p,
          ),
        },
        actorName,
        "Payout released",
        batchId,
      )
      const row = next.payoutBatches.find((p) => p.id === batchId)
      if (row) {
        syncAgencyPayoutFromAdmin({
          agencyId: row.agencyId,
          payout: {
            id: row.id,
            periodLabel: row.periodLabel,
            netPayableTnd: row.netPayableTnd,
            commissionTnd: row.commissionTnd,
            listedTotalTnd: row.listedTotalTnd,
            status: row.status,
            ibanLast4: row.ibanLast4,
            bookingIds: row.bookingIds,
          },
        })
      }
      return next
    })
    setFlash("Released to scheduled. Agency portal synced.")
  }

  return (
    <AdminShell
      title={batch.periodLabel}
      description={`${batch.agencyName} · ${batch.status.replaceAll("_", " ")}`}
      actions={
        <AdminLinkButton href="/admin/finance/payouts" variant="secondary">
          All batches
        </AdminLinkButton>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {flash ? (
          <p className="text-sm lg:col-span-2" role="status">
            {flash}
          </p>
        ) : null}

        {pending ? (
          <div className="lg:col-span-2">
            <DualControlPendingBanner pending={pending} />
          </div>
        ) : null}

        <AdminPanel title="Totals">
          <AdminKeyValue
            rows={[
              { label: "Listed (excl. deposit)", value: formatAdminTnd(batch.listedTotalTnd) },
              { label: "Wheelio fee", value: formatAdminTnd(batch.commissionTnd) },
              { label: "Net payable", value: formatAdminTnd(batch.netPayableTnd) },
              { label: "Bank", value: `···${batch.ibanLast4}` },
              { label: "Hold reason", value: batch.holdReason ?? "None" },
              {
                label: "Dual-control threshold",
                value: formatAdminTnd(workspace.dualControlThresholdTnd),
              },
            ]}
          />
        </AdminPanel>

        <AdminPanel title="Included bookings">
          {batch.bookingRefs.length === 0 ? (
            <p className={cn("text-sm", adminMuted)}>Legacy refs only in demo data.</p>
          ) : (
            <ul className="space-y-1 font-mono text-sm">
              {batch.bookingRefs.map((ref, i) => {
                const id = batch.bookingIds[i]
                return (
                  <li key={ref}>
                    {id ? (
                      <Link
                        href={`/admin/bookings/${id}`}
                        className="underline underline-offset-4"
                      >
                        {ref}
                      </Link>
                    ) : (
                      ref
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </AdminPanel>

        {canWrite ? (
          <AdminPanel title="Hold / release" className="lg:col-span-2">
            <AdminTip>
              Release above {formatAdminTnd(workspace.dualControlThresholdTnd)} (or from
              hold) needs MFA + a second staff signer. Agency portal payout row updates on
              hold and on approved release.
            </AdminTip>
            <AdminField label="Hold reason">
              <AdminInput value={holdReason} onChange={(e) => setHoldReason(e.target.value)} />
            </AdminField>
            <div className="mt-3 flex flex-wrap gap-2">
              <AdminSecondaryButton type="button" onClick={hold}>
                Place hold
              </AdminSecondaryButton>
              <AdminPrimaryButton
                type="button"
                onClick={requestRelease}
                disabled={Boolean(pending)}
              >
                {needsDual ? t("dual.submit") : "Release to scheduled"}
              </AdminPrimaryButton>
            </div>
          </AdminPanel>
        ) : null}
      </div>

      <div className="mt-4">
        <AdminAuditStrip entries={workspace.audit.filter((e) => e.entity === batch.id)} />
      </div>
    </AdminShell>
  )
}
