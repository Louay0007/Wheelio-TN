"use client"

import { AdminShell } from "@/components/admin/admin-shell"
import { AdminLinkButton, AdminPanel, adminMutedSoft } from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
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
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function AdminAnalyticsSupplyPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Supply analytics">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const vehicles = workspace.agencies.reduce((s, a) => s + a.vehicleCount, 0)
  const branches = workspace.agencies.reduce((s, a) => s + a.branchCount, 0)
  const flaggedPct = workspace.vehicles.length
    ? Math.round(
        (workspace.vehicles.filter((v) => v.flags.length > 0).length /
          workspace.vehicles.length) *
          100,
      )
    : 0

  return (
    <AdminShell
      title="Supply"
      description="Fleet and location coverage."
      actions={
        <AdminLinkButton href="/admin/analytics" variant="secondary">
          Overview
        </AdminLinkButton>
      }
    >
      <AdminPanel>
        <dl className={cn("mb-4 grid gap-2 text-sm sm:grid-cols-3")}>
          <div>
            <dt className={adminMutedSoft}>Vehicles (agencies)</dt>
            <dd className="font-mono text-lg font-semibold">{vehicles}</dd>
          </div>
          <div>
            <dt className={adminMutedSoft}>Branches</dt>
            <dd className="font-mono text-lg font-semibold">{branches}</dd>
          </div>
          <div>
            <dt className={adminMutedSoft}>Locations</dt>
            <dd className="font-mono text-lg font-semibold">{workspace.locations.length}</dd>
          </div>
        </dl>
        <Bar label="Vehicles with QA flags" pct={flaggedPct} />
        <div className="mt-6 space-y-2 text-sm">
          <p className={adminMutedSoft}>By city (live agencies)</p>
          {Object.entries(
            workspace.agencies
              .filter((a) => a.verification === "live")
              .reduce<Record<string, number>>((acc, a) => {
                acc[a.city] = (acc[a.city] ?? 0) + 1
                return acc
              }, {}),
          ).map(([city, n]) => (
            <div key={city} className="flex justify-between gap-3">
              <span>{city}</span>
              <span className="font-mono tabular-nums">{n}</span>
            </div>
          ))}
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
