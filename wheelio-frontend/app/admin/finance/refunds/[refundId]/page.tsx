"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminField,
  AdminInput,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSelect,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd, pushAudit, roleCanWriteFinance } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminRefundDetailPage() {
  const { refundId } = useParams<{ refundId: string }>()
  const { workspace, ready, session, updateWorkspace } = useAdminSession()
  const refund = workspace?.refunds.find((r) => r.id === refundId)
  const [status, setStatus] = useState(refund?.status ?? "requested")
  const [customerAmount, setCustomerAmount] = useState(String(refund?.customerAmountTnd ?? 0))
  const [msg, setMsg] = useState<string | null>(null)

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Refund">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!refund) {
    return (
      <AdminShell title="Refund not found">
        <AdminLinkButton href="/admin/finance/refunds" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  const canWrite = roleCanWriteFinance(session.role)
  const refundRow = refund
  const actorName = session.name

  function save() {
    if (!canWrite) return
    const amt = Number(customerAmount)
    updateWorkspace((ws) => {
      if (!ws) return ws
      let next = {
        ...ws,
        refunds: ws.refunds.map((r) =>
          r.id === refundRow.id
            ? {
                ...r,
                status,
                customerAmountTnd: Number.isNaN(amt) ? r.customerAmountTnd : amt,
              }
            : r,
        ),
      }
      next = pushAudit(next, actorName, "Refund updated", refundRow.id)
      return next
    })
    setMsg("Saved.")
  }

  return (
    <AdminShell title={`Refund · ${refund.bookingRef}`} description={refund.reason}>
      <div className="grid max-w-2xl gap-4">
        <AdminPanel title="Linked booking">
          <AdminKeyValue
            rows={[
              {
                label: "Booking",
                value: (
                  <Link
                    href={`/admin/bookings/${refund.bookingId}`}
                    className="underline underline-offset-4"
                  >
                    {refund.bookingRef}
                  </Link>
                ),
              },
              { label: "Created", value: new Date(refund.createdAt).toLocaleString() },
            ]}
          />
        </AdminPanel>

        <AdminPanel title="Commission impact preview">
          <p className={cn("text-sm", adminMuted)}>
            Rent refund only below. Deposit release is a separate explicit action on the
            booking money page.
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Agency clawback</dt>
              <dd className="font-mono">{formatAdminTnd(refund.agencyClawbackTnd)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Wheelio absorbs</dt>
              <dd className="font-mono">{formatAdminTnd(refund.wheelioAbsorbsTnd)}</dd>
            </div>
          </dl>
        </AdminPanel>

        {canWrite ? (
          <AdminPanel title="Update">
            <AdminField label="Status">
              <AdminSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Customer refund amount (TND)">
              <AdminInput
                type="number"
                value={customerAmount}
                onChange={(e) => setCustomerAmount(e.target.value)}
              />
            </AdminField>
            <AdminPrimaryButton type="button" className="mt-3" onClick={save}>
              Save
            </AdminPrimaryButton>
            {msg ? <p className={cn("mt-2 text-sm", adminMuted)}>{msg}</p> : null}
          </AdminPanel>
        ) : null}
      </div>
    </AdminShell>
  )
}
