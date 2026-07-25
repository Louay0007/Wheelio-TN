"use client"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminLinkButton,
  AdminPanel,
  AdminStat,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd } from "@/lib/admin"
import { cn } from "@/lib/utils"

function Bar({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={adminMutedSoft}>{label}</span>
        <span className="font-mono tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-950 dark:bg-zinc-50"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Analytics">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const liveAgencies = workspace.agencies.filter((a) => a.verification === "live").length
  const totalAgencies = workspace.agencies.length
  const gmv = workspace.agencies.reduce((s, a) => s + a.gmv30dTnd, 0)
  const commission = workspace.bookings.reduce((s, b) => s + b.commissionTnd, 0)
  const requested = workspace.bookings.filter((b) => b.status === "requested").length
  const confirmed = workspace.bookings.filter((b) =>
    ["confirmed", "active", "completed"].includes(b.status),
  ).length
  const convPct =
    requested + confirmed > 0
      ? Math.round((confirmed / (requested + confirmed)) * 100)
      : 0

  return (
    <AdminShell
      title="Analytics"
      description="Demo KPIs from workspace seed. Deposit excluded from GMV."
      actions={
        <AdminLinkButton href="/admin/analytics/finance" variant="secondary">
          Finance drill-down
        </AdminLinkButton>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat label="GMV 30d" value={formatAdminTnd(gmv)} />
        <AdminStat label="Commission demo" value={formatAdminTnd(commission)} />
        <AdminStat label="Live agencies" value={`${liveAgencies}/${totalAgencies}`} />
        <AdminStat label="Bookings" value={String(workspace.bookings.length)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Mix (monochrome bars)">
          <div className="space-y-4">
            <Bar
              label="Live agency share"
              pct={totalAgencies ? Math.round((liveAgencies / totalAgencies) * 100) : 0}
            />
            <Bar label="Request to confirmed (demo)" pct={convPct} />
            <Bar
              label="Flagged reviews"
              pct={
                workspace.reviews.length
                  ? Math.round(
                      (workspace.reviews.filter((r) => r.status === "flagged").length /
                        workspace.reviews.length) *
                        100,
                    )
                  : 0
              }
            />
          </div>
        </AdminPanel>
        <AdminPanel title="Sections">
          <ul className={cn("space-y-2 text-sm", adminMuted)}>
            <li>
              <AdminLinkButton href="/admin/analytics/supply" variant="secondary" className="w-full">
                Supply
              </AdminLinkButton>
            </li>
            <li>
              <AdminLinkButton href="/admin/analytics/demand" variant="secondary" className="w-full">
                Demand
              </AdminLinkButton>
            </li>
            <li>
              <AdminLinkButton href="/admin/analytics/quality" variant="secondary" className="w-full">
                Quality
              </AdminLinkButton>
            </li>
            <li>
              <AdminLinkButton href="/admin/analytics/finance" variant="secondary" className="w-full">
                Finance
              </AdminLinkButton>
            </li>
          </ul>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
