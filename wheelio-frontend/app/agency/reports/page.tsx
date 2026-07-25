"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

export default function ReportsPage() {
  const { workspace } = useAgencySession()
  const byStatus: Record<string, number> = {}
  for (const b of workspace?.bookings ?? []) {
    byStatus[b.status] = (byStatus[b.status] ?? 0) + 1
  }
  return (
    <AgencyShell
      title="Reports"
      description="Monochrome bars - no rainbow charts."
      actions={<Link href="/agency/reports/quality" className="inline-flex h-11 items-center rounded-[8px] border border-zinc-200 dark:border-zinc-700 px-4 text-sm font-semibold">Quality scorecard</Link>}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Acceptance</p><p className="mt-1 font-mono text-2xl font-semibold">{workspace?.acceptanceRate}%</p></div>
        <div className="rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Avg response</p><p className="mt-1 font-mono text-2xl font-semibold">{workspace?.avgResponseHours}h</p></div>
        <div className="rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-4"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Quality</p><p className="mt-1 font-mono text-2xl font-semibold">{workspace?.qualityScore}</p></div>
      </div>
      <h2 className="mt-8 text-sm font-semibold">Bookings by status</h2>
      <ul className="mt-3 space-y-2">
        {Object.entries(byStatus).map(([status, count]) => (
          <li key={status} className="flex items-center gap-3 text-sm">
            <span className="w-36 capitalize">{status.replaceAll("_", " ")}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <span className="block h-full bg-black dark:bg-white" style={{ width: `${Math.min(100, count * 12)}%` }} />
            </span>
            <span className="font-mono w-6 text-right">{count}</span>
          </li>
        ))}
      </ul>
      <Link href="/agency/reviews" className="mt-6 inline-flex text-sm underline">Customer reviews</Link>
    </AgencyShell>
  )
}
