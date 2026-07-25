"use client"

import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminEmpty,
  AdminField,
  AdminLinkButton,
  AdminPanel,
  AdminSecondaryButton,
  AdminSelect,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd } from "@/lib/admin"
import { useAdminApiLedger } from "@/lib/hooks/use-admin-api"
import { cn } from "@/lib/utils"

type LedgerRow = {
  id: string
  at: string
  type: string
  bookingRef?: string
  agencyName?: string
  amountTnd: number
  isDepositMemo?: boolean
}

export default function AdminLedgerPage() {
  const { workspace, ready } = useAdminSession()
  const api = useAdminApiLedger()
  const [type, setType] = useState("all")
  const [hideDeposit, setHideDeposit] = useState(true)

  const demoRows = useMemo(() => {
    if (!workspace) return [] as LedgerRow[]
    const out: LedgerRow[] = []
    for (const b of workspace.bookings) {
      if (["confirmed", "active", "completed"].includes(b.status)) {
        out.push({
          id: `comm-${b.id}`,
          at: b.timeline[0]?.at ?? new Date().toISOString(),
          type: "commission",
          bookingRef: b.reference,
          agencyName: b.agencyName,
          amountTnd: b.commissionTnd,
        })
      }
      out.push({
        id: `dep-${b.id}`,
        at: b.timeline[0]?.at ?? new Date().toISOString(),
        type: "deposit_memo",
        bookingRef: b.reference,
        agencyName: b.agencyName,
        amountTnd: b.depositTnd,
        isDepositMemo: true,
      })
    }
    for (const p of workspace.payoutBatches) {
      out.push({
        id: `pay-${p.id}`,
        at: new Date().toISOString(),
        type: `payout_${p.status}`,
        agencyName: p.agencyName,
        amountTnd: -p.netPayableTnd,
      })
    }
    return out
  }, [workspace])

  const source = api.enabled ? api.rows : demoRows

  const rows = useMemo(() => {
    return source
      .filter((r) => (type === "all" ? true : r.type.startsWith(type)))
      .filter((r) => (hideDeposit ? !r.isDepositMemo : true))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [source, type, hideDeposit])

  const pageReady = api.enabled ? !api.loading : ready && Boolean(workspace)

  return (
    <AdminShell
      title="Ledger"
      description={
        api.enabled
          ? "Live ledger transactions (deposit memos hidden by default)."
          : "Marketplace movements in TND."
      }
      actions={
        <AdminSecondaryButton type="button" disabled={!rows.length}>
          {rows.length} row(s)
        </AdminSecondaryButton>
      }
    >
      {!pageReady ? (
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          {api.enabled && api.error ? (
            <AdminPanel>
              <p className="text-sm text-red-700">{api.error}</p>
            </AdminPanel>
          ) : null}
          <div className="flex flex-wrap items-end gap-3">
            <AdminField label="Type">
              <AdminSelect
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="min-w-[160px]"
              >
                <option value="all">All</option>
                <option value="commission">Commission</option>
                <option value="payout">Payout</option>
                <option value="refund">Refund</option>
                <option value="deposit">Deposit memo</option>
                <option value="rental">Rental capture</option>
              </AdminSelect>
            </AdminField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hideDeposit}
                onChange={(e) => setHideDeposit(e.target.checked)}
              />
              Hide deposit memo (excluded from GMV)
            </label>
          </div>

          {rows.length === 0 ? (
            <AdminEmpty title="No rows" body="Adjust filters or seed demo data." />
          ) : (
            <AdminPanel>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-semibold">
                        {r.type.replaceAll("_", " ")}
                        {r.isDepositMemo ? " (excl. GMV)" : ""}
                      </p>
                      <p className={cn("text-xs", adminMutedSoft)}>
                        {new Date(r.at).toLocaleString()} · {r.bookingRef ?? "-"}{" "}
                        · {r.agencyName ?? "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "font-mono font-semibold tabular-nums",
                          r.isDepositMemo && adminMuted,
                        )}
                      >
                        {formatAdminTnd(r.amountTnd)}
                      </span>
                      {r.bookingRef ? (
                        <AdminLinkButton
                          href={`/admin/bookings/${r.bookingRef}`}
                          variant="secondary"
                          className="h-8 text-xs"
                        >
                          Open
                        </AdminLinkButton>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </AdminPanel>
          )}
        </div>
      )}
    </AdminShell>
  )
}
