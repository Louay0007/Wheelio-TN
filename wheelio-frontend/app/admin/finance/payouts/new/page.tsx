"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findAgency, formatAdminTnd, pushAudit } from "@/lib/admin"
import { createAdminPayoutBatch } from "@/lib/gateways/admin"
import { useApiAdminSlice } from "@/lib/gateways/flags"
import { cn } from "@/lib/utils"

export default function AdminNewPayoutPage() {
  const { workspace, ready, session, updateWorkspace } = useAdminSession()
  const router = useRouter()
  const apiEnabled = useApiAdminSlice()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eligible = useMemo(() => {
    if (!workspace) return []
    const batched = new Set(workspace.payoutBatches.flatMap((p) => p.bookingIds))
    return workspace.bookings.filter(
      (b) => b.status === "completed" && !batched.has(b.id),
    )
  }, [workspace])

  const byAgency = useMemo(() => {
    const map = new Map<string, typeof eligible>()
    for (const b of eligible) {
      const list = map.get(b.agencyId) ?? []
      list.push(b)
      map.set(b.agencyId, list)
    }
    return map
  }, [eligible])

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="New payout batch">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const wsSnapshot = workspace
  const actorName = session.name

  async function createForAgency(agencyId: string) {
    setBusy(true)
    setError(null)
    try {
      if (apiEnabled) {
        const periodEnd = new Date()
        const periodStart = new Date()
        periodStart.setUTCDate(periodStart.getUTCDate() - 30)
        const batch = await createAdminPayoutBatch({
          agencyId,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
        })
        router.push(`/admin/finance/payouts/${batch.payoutId}`)
        return
      }
      const bookings = byAgency.get(agencyId)
      if (!bookings?.length) return
      const agency = findAgency(wsSnapshot, agencyId)
      if (!agency) return
      const listedTotalTnd = bookings.reduce((s, b) => s + b.listedTotalTnd, 0)
      const commissionTnd = bookings.reduce((s, b) => s + b.commissionTnd, 0)
      const netPayableTnd = bookings.reduce((s, b) => s + b.agencyNetTnd, 0)
      const id = `po-${Date.now()}`
      updateWorkspace((ws) => {
        if (!ws) return ws
        let next: typeof ws = {
          ...ws,
          payoutBatches: [
            {
              id,
              agencyId,
              agencyName: agency.tradeName,
              periodLabel: `Draft ${new Date().toLocaleDateString()}`,
              status: "draft" as const,
              netPayableTnd,
              commissionTnd,
              listedTotalTnd,
              bookingIds: bookings.map((b) => b.id),
              bookingRefs: bookings.map((b) => b.reference),
              ibanLast4: agency.ibanLast4,
            },
            ...ws.payoutBatches,
          ],
        }
        next = pushAudit(next, actorName, "Payout draft created", id)
        return next
      })
      router.push(`/admin/finance/payouts/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payout create failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminShell
      title="Create payout batch"
      description="Pull completed bookings not yet in a batch. Deposit never in net payable."
    >
      <div className="max-w-2xl space-y-4">
        <AdminTip>
          Each batch is per agency. Deposit is never in net payable.
          {apiEnabled ? " API slice posts deposit-absent payout items." : ""}
        </AdminTip>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {apiEnabled ? (
          <AdminPanel title="API mode">
            <p className={cn("text-sm", adminMuted)}>
              Create a draft from reconciled deposit_online agency_net for the
              last 30 days. Pay-at-agency bookings only post commission receivable.
            </p>
            {workspace.agencies.map((agency) => (
              <AdminPrimaryButton
                key={agency.id}
                type="button"
                className="mt-3 mr-2"
                disabled={busy}
                onClick={() => void createForAgency(agency.id)}
              >
                Draft for {agency.tradeName}
              </AdminPrimaryButton>
            ))}
          </AdminPanel>
        ) : byAgency.size === 0 ? (
          <AdminPanel title="Nothing eligible">
            <p className={cn("text-sm", adminMuted)}>
              All completed bookings are already batched or none completed yet.
            </p>
            <AdminLinkButton
              href="/admin/finance/payouts"
              variant="secondary"
              className="mt-3"
            >
              Back to payouts
            </AdminLinkButton>
          </AdminPanel>
        ) : (
          [...byAgency.entries()].map(([agencyId, bookings]) => {
            const agency = findAgency(workspace, agencyId)!
            const net = bookings.reduce((s, b) => s + b.agencyNetTnd, 0)
            return (
              <AdminPanel key={agencyId} title={agency.tradeName}>
                <p className="text-sm">
                  {bookings.length} booking(s) · net {formatAdminTnd(net)}
                </p>
                <ul className={cn("mt-2 text-sm", adminMuted)}>
                  {bookings.map((b) => (
                    <li key={b.id} className="font-mono">
                      {b.reference}
                    </li>
                  ))}
                </ul>
                <AdminPrimaryButton
                  type="button"
                  className="mt-3"
                  disabled={busy}
                  onClick={() => void createForAgency(agencyId)}
                >
                  Create draft batch
                </AdminPrimaryButton>
              </AdminPanel>
            )
          })
        )}
      </div>
    </AdminShell>
  )
}
