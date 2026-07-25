"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSelect,
  AdminSecondaryButton,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import {
  bookingStatusLabel,
  formatAdminTnd,
  type AdminBooking,
  type AdminBookingStatus,
} from "@/lib/admin"
import { millimesToTnd } from "@/lib/gateways/agency"
import { useAdminApiBookings } from "@/lib/hooks/use-admin-api"
import { cn } from "@/lib/utils"

function slaRisk(b: { status: string; slaExpiresAt?: string | null }) {
  if (b.status !== "requested" || !b.slaExpiresAt) return false
  const left = new Date(b.slaExpiresAt).getTime() - Date.now()
  return left > 0 && left < 2 * 3600_000
}

export default function AdminBookingsPage() {
  const { workspace, ready } = useAdminSession()
  const api = useAdminApiBookings()
  const [status, setStatus] = useState<string>("all")
  const [agency, setAgency] = useState<string>("all")
  const [payment, setPayment] = useState<string>("all")
  const [confirmation, setConfirmation] = useState<string>("all")
  const [query, setQuery] = useState("")
  const [slaOnly, setSlaOnly] = useState(false)

  const demoRows = workspace?.bookings ?? []
  const apiRows: AdminBooking[] = (api.bookings ?? []).map((b) => {
    const listed = millimesToTnd(b.listedTotalMillimes)
    const commission = millimesToTnd(b.commissionMillimes)
    return {
      id: b.id,
      reference: b.reference,
      status: b.status as AdminBookingStatus,
      confirmation: b.confirmation,
      agencyId: b.agencyId,
      agencyName: b.agencyId,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: "",
      categoryLabel: "—",
      branchLabel: "—",
      pickupLabel: new Date(b.pickupAt).toLocaleString(),
      returnLabel: new Date(b.returnAt).toLocaleString(),
      listedTotalTnd: listed,
      agencyNetTnd: millimesToTnd(b.agencyNetMillimes),
      commissionTnd: commission,
      takeRatePercent:
        listed > 0 ? Math.round((commission / listed) * 1000) / 10 : 0,
      depositTnd: millimesToTnd(b.depositMillimes),
      onlineCollectedTnd:
        b.paymentMode === "deposit_online" ? listed : 0,
      deskDueTnd: b.paymentMode === "pay_at_agency" ? listed : 0,
      paymentMode:
        b.paymentMode === "deposit_online" ? "deposit_online" : "desk",
      slaExpiresAt: b.slaExpiresAt ?? undefined,
      hasOpenCase: false,
      hasOpenClaim: false,
      timeline: [],
    }
  })

  const source = api.enabled ? apiRows : demoRows

  const filtered = useMemo(() => {
    return source.filter((b) => {
      if (status !== "all" && b.status !== status) return false
      if (agency !== "all" && b.agencyId !== agency) return false
      if (payment !== "all" && b.paymentMode !== payment) return false
      if (confirmation !== "all" && b.confirmation !== confirmation) return false
      if (slaOnly && !slaRisk(b)) return false
      const q = query.trim().toLowerCase()
      if (!q) return true
      return (
        b.reference.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.agencyName.toLowerCase().includes(q)
      )
    })
  }, [source, status, agency, payment, confirmation, query, slaOnly])

  const pageReady = api.enabled ? !api.loading : ready && Boolean(workspace)

  return (
    <AdminShell
      title="Bookings"
      description={
        api.enabled
          ? "Live API bookings. Fee columns exclude deposit."
          : "Every trip across agencies. Fee columns exclude deposit."
      }
      actions={
        <AdminSecondaryButton type="button" disabled={!filtered.length}>
          {filtered.length} row(s)
        </AdminSecondaryButton>
      }
    >
      {!pageReady ? (
        <div className="h-48 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          {api.enabled && api.error ? (
            <AdminPanel>
              <p className="text-sm text-red-700">{api.error}</p>
            </AdminPanel>
          ) : null}
          <AdminPanel title="Filters">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminField label="Search">
                <AdminInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="WTN, customer, agency"
                />
              </AdminField>
              <AdminField label="Status">
                <AdminSelect
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  {(
                    [
                      "requested",
                      "confirmed",
                      "active",
                      "completed",
                      "cancelled",
                    ] as AdminBookingStatus[]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {bookingStatusLabel(s)}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              {!api.enabled ? (
                <AdminField label="Agency">
                  <AdminSelect
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                  >
                    <option value="all">All</option>
                    {workspace?.agencies.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.tradeName}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
              ) : null}
              <AdminField label="Payment mode">
                <AdminSelect
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="desk">Desk</option>
                  <option value="deposit_online">Deposit online</option>
                </AdminSelect>
              </AdminField>
              <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
                <input
                  type="checkbox"
                  checked={slaOnly}
                  onChange={(e) => setSlaOnly(e.target.checked)}
                  className="size-4 rounded border-zinc-300"
                />
                SLA at risk (&lt; 2h on requested)
              </label>
            </div>
          </AdminPanel>

          {filtered.length === 0 ? (
            <AdminEmpty
              title="No bookings"
              body="Try widening filters or clearing search."
            />
          ) : (
            <div className="overflow-x-auto rounded-[10px] border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.08em] dark:border-zinc-700 dark:bg-zinc-950">
                  <tr>
                    <th className="px-3 py-2">Reference</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Agency</th>
                    <th className="px-3 py-2">Pickup</th>
                    <th className="px-3 py-2 text-right">Listed</th>
                    <th className="px-3 py-2 text-right">Net</th>
                    <th className="px-3 py-2 text-right">Fee</th>
                    <th className="px-3 py-2 text-right">Deposit</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr
                      key={b.id}
                      className={cn(
                        "border-b border-zinc-100 dark:border-zinc-800",
                        slaRisk(b) && "bg-amber-50/80 dark:bg-amber-950/20",
                      )}
                    >
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className="font-mono font-semibold underline underline-offset-4"
                        >
                          {b.reference}
                        </Link>
                        {slaRisk(b) ? (
                          <span className="ml-2 inline-flex">
                            <AdminChip tone="warn">SLA</AdminChip>
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 capitalize">
                        {bookingStatusLabel(b.status)}
                      </td>
                      <td className="px-3 py-2">{b.customerName}</td>
                      <td className="px-3 py-2">{b.agencyName}</td>
                      <td className={cn("px-3 py-2", adminMuted)}>
                        {b.pickupLabel}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {formatAdminTnd(b.listedTotalTnd)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {formatAdminTnd(b.agencyNetTnd)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {formatAdminTnd(b.commissionTnd)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-mono tabular-nums",
                          adminMutedSoft,
                        )}
                      >
                        {formatAdminTnd(b.depositTnd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className={cn("text-xs", adminMutedSoft)}>
            {filtered.length} row(s). Deposit column is memo only, not GMV.
          </p>
        </div>
      )}
    </AdminShell>
  )
}
