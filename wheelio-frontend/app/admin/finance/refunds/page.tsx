"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminPanel, adminMuted } from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd } from "@/lib/admin"
import { millimesToTnd } from "@/lib/gateways/agency"
import { useAdminApiRefunds } from "@/lib/hooks/use-admin-api"
import { cn } from "@/lib/utils"

export default function AdminRefundsPage() {
  const { workspace, ready } = useAdminSession()
  const api = useAdminApiRefunds()

  const loading = api.enabled ? api.loading : !ready || !workspace

  return (
    <AdminShell
      title="Refunds"
      description="Customer refunds separate from deposit release."
    >
      {loading ? (
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      ) : api.enabled ? (
        <ul className="space-y-3">
          {api.error ? (
            <p className="text-sm text-red-600" role="alert">
              {api.error}
            </p>
          ) : null}
          {(api.refunds ?? []).length === 0 ? (
            <AdminPanel>
              <p className={cn("text-sm", adminMuted)}>No refund requests yet.</p>
            </AdminPanel>
          ) : (
            (api.refunds ?? []).map((r) => (
              <li key={r.id}>
                <Link href={`/admin/finance/refunds/${r.id}`} className="block">
                  <AdminPanel>
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-mono font-semibold">
                        {r.bookingId}
                      </span>
                      <span className="text-[11px] font-semibold uppercase">
                        {r.status}
                      </span>
                    </div>
                    <p className={cn("mt-2 text-sm", adminMuted)}>{r.reason}</p>
                    <p className="mt-1 font-mono text-sm tabular-nums">
                      Customer{" "}
                      {formatAdminTnd(
                        millimesToTnd(r.customerAmountMillimes),
                      )}{" "}
                      · includesDeposit={String(r.includesDeposit)}
                    </p>
                  </AdminPanel>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : (
        <ul className="space-y-3">
          {workspace!.refunds.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/finance/refunds/${r.id}`} className="block">
                <AdminPanel>
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-mono font-semibold">
                      {r.bookingRef}
                    </span>
                    <span className="text-[11px] font-semibold uppercase">
                      {r.status}
                    </span>
                  </div>
                  <p className={cn("mt-2 text-sm", adminMuted)}>{r.reason}</p>
                  <p className="mt-1 font-mono text-sm tabular-nums">
                    Customer {formatAdminTnd(r.customerAmountTnd)} · clawback{" "}
                    {formatAdminTnd(r.agencyClawbackTnd)} · Wheelio absorbs{" "}
                    {formatAdminTnd(r.wheelioAbsorbsTnd)}
                  </p>
                </AdminPanel>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  )
}
