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

export default function AdminAnalyticsQualityPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Quality analytics">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const avgScore =
    workspace.agencies.length > 0
      ? Math.round(
          workspace.agencies.reduce((s, a) => s + a.qualityScore, 0) /
            workspace.agencies.length,
        )
      : 0
  const avgAccept =
    workspace.agencies.length > 0
      ? Math.round(
          workspace.agencies.reduce((s, a) => s + a.acceptanceRate, 0) /
            workspace.agencies.length,
        )
      : 0
  const slaBreaches = workspace.agencies.reduce((s, a) => s + a.openSlaBreaches, 0)

  return (
    <AdminShell
      title="Quality"
      description="Agency scorecards and review health."
      actions={
        <AdminLinkButton href="/admin/analytics" variant="secondary">
          Overview
        </AdminLinkButton>
      }
    >
      <AdminPanel className="space-y-4">
        <Bar label="Avg quality score (demo)" pct={avgScore} />
        <Bar label="Avg acceptance rate" pct={avgAccept} />
        <Bar
          label="Open SLA breaches (scaled)"
          pct={Math.min(100, slaBreaches * 20)}
        />
        <ul className="space-y-2 text-sm">
          {workspace.agencies
            .slice()
            .sort((a, b) => b.qualityScore - a.qualityScore)
            .map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span>{a.tradeName}</span>
                <span className="font-mono tabular-nums">
                  {a.qualityScore} · {a.acceptanceRate}% accept
                </span>
              </li>
            ))}
        </ul>
      </AdminPanel>
    </AdminShell>
  )
}
