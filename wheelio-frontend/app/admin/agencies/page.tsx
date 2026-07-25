"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminPanel,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd, verificationLabel } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminAgenciesPage() {
  const { workspace } = useAdminSession()
  const rows = workspace?.agencies ?? []

  return (
    <AdminShell title="Agencies" description="Partner command centers. Fee on trip total only.">
      <div className="w-full space-y-4">
        <AdminPanel title="Directory" hint={`${rows.length} partners`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr
                  className={cn("text-xs uppercase tracking-wide",
                    adminMutedSoft,
                  )}
                >
                  <th className="pb-2 pr-3 font-semibold">Trade name</th>
                  <th className="pb-2 pr-3 font-semibold">City</th>
                  <th className="pb-2 pr-3 font-semibold">Verification</th>
                  <th className="pb-2 pr-3 font-semibold">Tier</th>
                  <th className="pb-2 pr-3 font-semibold">Instant</th>
                  <th className="pb-2 pr-3 font-semibold">SLA breaches</th>
                  <th className="pb-2 pr-3 font-semibold">GMV 30d</th>
                  <th className="pb-2 pr-3 font-semibold">Quality</th>
                  <th className="pb-2 font-semibold">Last active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/admin/agencies/${a.id}`}
                        className="font-semibold underline-offset-4 hover:underline"
                      >
                        {a.tradeName}
                      </Link>
                    </td>
                    <td className={cn("py-2.5 pr-3", adminMuted)}>{a.city}</td>
                    <td className="py-2.5 pr-3">
                      <AdminChip tone={a.verification === "live" ? "strong" : "neutral"}>
                        {verificationLabel(a.verification)}
                      </AdminChip>
                    </td>
                    <td className={cn("py-2.5 pr-3 font-mono tabular-nums", adminMuted)}>
                      {a.takeRatePercent}%
                    </td>
                    <td className={cn("py-2.5 pr-3", adminMuted)}>
                      {a.instantEnabled ? "Yes" : "No"}
                    </td>
                    <td className={cn("py-2.5 pr-3 font-mono tabular-nums", adminMuted)}>
                      {a.openSlaBreaches}
                    </td>
                    <td className={cn("py-2.5 pr-3 font-mono tabular-nums", adminMuted)}>
                      {formatAdminTnd(a.gmv30dTnd)}
                    </td>
                    <td className={cn("py-2.5 pr-3 font-mono tabular-nums", adminMuted)}>
                      {a.qualityScore}
                    </td>
                    <td className={cn("py-2.5 text-xs", adminMutedSoft)}>{a.lastActiveLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
