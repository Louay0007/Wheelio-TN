"use client"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminKeyValue,
  AdminPanel,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { cn } from "@/lib/utils"

export default function AdminCommissionsPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Commissions">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const netExample = 95
  const listedExample = Math.round(netExample / (1 - workspace.takeRateStandard / 100))

  return (
    <AdminShell
      title="Commissions"
      description="Global tiers from workspace. Historical bookings keep snapshot rates."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Global defaults">
          <AdminKeyValue
            rows={[
              { label: "Launch tier", value: `${workspace.takeRateLaunch}%` },
              { label: "Standard tier", value: `${workspace.takeRateStandard}%` },
              { label: "Volume tier", value: `${workspace.takeRateVolume}%` },
              {
                label: "Featured uplift (optional)",
                value: "+2%",
              },
            ]}
          />
          <AdminTip>
            Volume eligibility: about 30 confirmed bookings per month with SLA compliance.
          </AdminTip>
        </AdminPanel>

        <AdminPanel title="Worked example">
          <p className="text-sm">
            Agency net {netExample} TND at {workspace.takeRateStandard}% standard → customer
            listed about{" "}
            <span className="font-mono font-semibold">{listedExample} TND</span>.
          </p>
          <p className={cn("mt-2 text-sm", adminMuted)}>
            Deposit is never part of this math.
          </p>
        </AdminPanel>

        <AdminPanel title="Per-agency exceptions" className="lg:col-span-2">
          <ul className="space-y-2 text-sm">
            {workspace.agencies.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800"
              >
                <span className="font-medium">{a.tradeName}</span>
                <span>
                  Tier {a.commissionTier} · take {a.takeRatePercent}%
                </span>
                <span className={cn("text-xs", adminMuted)}>
                  {a.takeRatePercent !== workspace.takeRateStandard &&
                  a.commissionTier !== "launch"
                    ? "Exception: negotiated or legacy rate on file"
                    : "Uses tier default"}
                </span>
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
