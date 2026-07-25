"use client"

import { AdminShell } from "@/components/admin/admin-shell"
import { AdminLinkButton, AdminPanel, adminMutedSoft } from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"

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

export default function AdminAnalyticsDemandPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Demand analytics">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const instant = workspace.bookings.filter((b) => b.confirmation === "instant").length
  const request = workspace.bookings.filter((b) => b.confirmation === "request").length
  const total = instant + request || 1
  const activePromos = workspace.promotions.filter((p) => p.status === "active").length

  return (
    <AdminShell
      title="Demand"
      description="Booking intent and promo pull."
      actions={
        <AdminLinkButton href="/admin/analytics" variant="secondary">
          Overview
        </AdminLinkButton>
      }
    >
      <AdminPanel className="space-y-4">
        <Bar label="Instant confirmation share" pct={Math.round((instant / total) * 100)} />
        <Bar label="Request flow share" pct={Math.round((request / total) * 100)} />
        <Bar
          label="Active promos vs catalog"
          pct={Math.round(
            (activePromos / Math.max(workspace.promotions.length, 1)) * 100,
          )}
        />
      </AdminPanel>
    </AdminShell>
  )
}
