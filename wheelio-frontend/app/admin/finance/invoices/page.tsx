"use client"

import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminEmpty,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd, pushAudit, type AdminInvoice } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminInvoicesPage() {
  const { workspace, session, ready, updateWorkspace } = useAdminSession()
  const [flash, setFlash] = useState<string | null>(null)

  const invoices = useMemo(() => workspace?.invoices ?? [], [workspace])

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Invoices">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  function setStatus(id: string, status: AdminInvoice["status"]) {
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        {
          ...ws,
          invoices: (ws.invoices ?? []).map((i) =>
            i.id === id ? { ...i, status } : i,
          ),
        },
        session!.name,
        `Invoice ${id} → ${status}`,
        id,
      )
    })
    setFlash(`Invoice ${id} marked ${status}.`)
  }

  function draftFromPayout() {
    const open = workspace!.payoutBatches.find((p) =>
      ["scheduled", "pending_approval", "paid"].includes(p.status),
    )
    if (!open) {
      setFlash("No payout batch to invoice.")
      return
    }
    const row: AdminInvoice = {
      id: `inv-${Date.now()}`,
      agencyId: open.agencyId,
      agencyName: open.agencyName,
      periodLabel: open.periodLabel,
      commissionTnd: open.commissionTnd,
      status: "draft",
      createdAt: new Date().toISOString(),
    }
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        { ...ws, invoices: [row, ...(ws.invoices ?? [])] },
        session!.name,
        `Draft invoice from ${open.id}`,
        row.id,
      )
    })
    setFlash("Draft invoice created from payout batch.")
  }

  return (
    <AdminShell
      title="Invoices"
      description="Marketplace commission invoices per payout period (demo)."
      actions={
        <AdminPrimaryButton type="button" onClick={draftFromPayout}>
          Draft from payout
        </AdminPrimaryButton>
      }
    >
      {flash ? (
        <p className="mb-3 text-sm" role="status">
          {flash}
        </p>
      ) : null}
      <AdminTip>
        PDF export and Tunisian tax IDs stay out of scope. Status flow: draft → sent → paid.
      </AdminTip>
      {invoices.length === 0 ? (
        <AdminPanel className="mt-4">
          <AdminEmpty
            title="No invoices yet"
            body="Create a draft from an existing payout batch."
          />
        </AdminPanel>
      ) : (
        <AdminPanel className="mt-4" title="Register">
          <ul className="space-y-3 text-sm">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800"
              >
                <div>
                  <p className="font-semibold">
                    {inv.agencyName} · {inv.periodLabel}
                  </p>
                  <p className={cn("font-mono text-xs", adminMuted)}>
                    {inv.id} · fee {formatAdminTnd(inv.commissionTnd)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminChip
                    tone={inv.status === "paid" ? "strong" : "neutral"}
                  >
                    {inv.status}
                  </AdminChip>
                  {inv.status === "draft" ? (
                    <AdminSecondaryButton
                      type="button"
                      className="h-9 text-xs"
                      onClick={() => setStatus(inv.id, "sent")}
                    >
                      Mark sent
                    </AdminSecondaryButton>
                  ) : null}
                  {inv.status === "sent" ? (
                    <AdminSecondaryButton
                      type="button"
                      className="h-9 text-xs"
                      onClick={() => setStatus(inv.id, "paid")}
                    >
                      Mark paid
                    </AdminSecondaryButton>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </AdminPanel>
      )}
    </AdminShell>
  )
}
