"use client"

import { useParams } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminLinkButton,
  AdminPanel,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"

export default function AdminCustomerRiskPage() {
  const { userId } = useParams<{ userId: string }>()
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Customer risk">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const customer = workspace.customers.find((c) => c.id === userId)
  const openClaims = workspace.claims.filter(
    (c) => c.source === "customer" && customer && c.bookingRef,
  )

  return (
    <AdminShell
      title="Risk signals"
      description={customer?.name ?? userId}
      actions={
        <AdminLinkButton href={`/admin/customers/${userId}`} variant="secondary">
          Profile
        </AdminLinkButton>
      }
    >
      <AdminTip>Demo heuristics only. No automated blocking.</AdminTip>
      {!customer ? (
        <p className="mt-4 text-sm">Customer not found.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <AdminPanel title="Flags">
            {customer.riskFlags.length === 0 ? (
              <p className={`text-sm ${adminMuted}`}>No flags on file.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {customer.riskFlags.map((f) => (
                  <AdminChip key={f} tone="warn">
                    {f}
                  </AdminChip>
                ))}
              </ul>
            )}
          </AdminPanel>
          <AdminPanel title="Related claims">
            <ul className="space-y-2 text-sm">
              {openClaims.map((c) => (
                <li key={c.id}>
                  {c.type} · {c.bookingRef} · {c.status}
                </li>
              ))}
              {openClaims.length === 0 ? (
                <li className={adminMuted}>No linked claims in demo data.</li>
              ) : null}
            </ul>
          </AdminPanel>
        </div>
      )}
    </AdminShell>
  )
}
