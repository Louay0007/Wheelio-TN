"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  BookingStatusChip,
  ConfirmationBadge,
} from "@/components/agency/agency-ui"
import {
  AgencyInput,
  AgencyLinkButton,
  AgencyPanel,
  AgencySecondaryButton,
  AgencySelect,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import {
  formatAgencyTnd,
  type AgencyBookingStatus,
} from "@/lib/agency"
import { useAgencyApiBookings } from "@/lib/hooks/use-agency-api-bookings"
import { cn } from "@/lib/utils"

export default function AgencyBookingsPage() {
  const { workspace, ready, branchId: deskFilter } = useAgencySession()
  const api = useAgencyApiBookings()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<AgencyBookingStatus | "all">("all")
  const [branchId, setBranchId] = useState("all")

  const effectiveBranch = branchId !== "all" ? branchId : deskFilter
  const sourceBookings = api.enabled ? (api.bookings ?? []) : (workspace?.bookings ?? [])
  const branches = workspace?.branches ?? []

  const rows = useMemo(() => {
    return sourceBookings
      .filter((b) => (status === "all" ? true : b.status === status))
      .filter((b) =>
        api.enabled
          ? true
          : effectiveBranch === "all"
            ? true
            : b.branchId === effectiveBranch,
      )
      .filter((b) => {
        const s = q.trim().toLowerCase()
        if (!s) return true
        return (
          b.reference.toLowerCase().includes(s) ||
          b.customerName.toLowerCase().includes(s) ||
          b.customerEmail.toLowerCase().includes(s) ||
          b.customerPhone.includes(s) ||
          b.categoryLabel.toLowerCase().includes(s)
        )
      })
      .sort(
        (a, b) => new Date(a.pickupAt).getTime() - new Date(b.pickupAt).getTime(),
      )
  }, [sourceBookings, q, status, effectiveBranch, api.enabled])

  function exportCsv() {
    const header = "ref,status,customer,listed,net,commission,deposit\n"
    const body = rows
      .map(
        (b) =>
          `${b.reference},${b.status},${b.customerName},${b.listedTotalTnd},${b.agencyNetTnd},${b.commissionTnd},${b.depositTnd}`,
      )
      .join("\n")
    const blob = new Blob([header + body], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "wheelio-agency-bookings.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const pageReady = api.enabled
    ? !api.loading
    : ready && Boolean(workspace)

  return (
    <AgencyShell
      title="All bookings"
      description={
        api.enabled
          ? "Live API bookings for your agency. Deposit stays out of listed/net."
          : "Find any reservation by name, phone, or booking code."
      }
      actions={
        <>
          <AgencyLinkButton href="/agency/bookings/calendar" variant="secondary">
            Calendar
          </AgencyLinkButton>
          <AgencySecondaryButton type="button" onClick={exportCsv}>
            Download CSV
          </AgencySecondaryButton>
        </>
      }
    >
      {!pageReady ? (
        <div className="h-40 w-full animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          {api.enabled && api.error ? (
            <AgencyPanel>
              <p className="text-sm text-red-700 dark:text-red-300">{api.error}</p>
            </AgencyPanel>
          ) : null}
          <AgencyPanel>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_220px]">
              <AgencyInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search code, name, email, phone, or car"
                aria-label="Search bookings"
              />
              <AgencySelect
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AgencyBookingStatus | "all")
                }
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {[
                  "requested",
                  "held",
                  "payment_pending",
                  "confirmed",
                  "active",
                  "completed",
                  "cancelled",
                  "expired",
                  "rejected",
                  "no_show",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </AgencySelect>
              {!api.enabled ? (
                <AgencySelect
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  aria-label="Filter by desk"
                >
                  <option value="all">All desks</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </AgencySelect>
              ) : (
                <div className={cn("flex items-center text-sm", agencyMuted)}>
                  API slice · agency scoped
                </div>
              )}
            </div>
            <p className={cn("mt-3 text-sm", agencyMuted)}>
              Showing {rows.length} booking{rows.length === 1 ? "" : "s"}
            </p>
          </AgencyPanel>

          <AgencyTip>
            Click a booking code to open desk tools. Deposit is never part of your
            fee.
          </AgencyTip>

          <div className="hidden w-full overflow-x-auto rounded-[12px] border border-zinc-200 dark:border-zinc-700 md:block">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-3 font-semibold">Code</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Car</th>
                  <th className="px-3 py-3 font-semibold">Pickup</th>
                  <th className="px-3 py-3 font-semibold">Customer price</th>
                  <th className="px-3 py-3 font-semibold">You keep</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/agency/bookings/${b.id}`}
                        className="font-mono font-semibold underline-offset-4 hover:underline"
                      >
                        {b.reference}
                      </Link>
                      <div className="mt-1">
                        <ConfirmationBadge confirmation={b.confirmation} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <BookingStatusChip status={b.status} />
                    </td>
                    <td className="px-3 py-3 font-medium">{b.customerName}</td>
                    <td className={cn("px-3 py-3", agencyMuted)}>
                      {b.categoryLabel}
                    </td>
                    <td className={cn("px-3 py-3", agencyMuted)}>
                      {b.pickupLabel}
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums">
                      {formatAgencyTnd(b.listedTotalTnd)}
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums">
                      {formatAgencyTnd(b.agencyNetTnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {rows.map((b) => (
              <li key={`m-${b.id}`}>
                <Link
                  href={`/agency/bookings/${b.id}`}
                  className="block rounded-[12px] border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold">{b.reference}</span>
                    <BookingStatusChip status={b.status} />
                  </div>
                  <p className="mt-2 font-medium">{b.customerName}</p>
                  <p className={cn("mt-1 text-sm", agencyMuted)}>{b.pickupLabel}</p>
                  <p className="mt-2 font-mono text-sm">
                    You keep {formatAgencyTnd(b.agencyNetTnd)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AgencyShell>
  )
}
