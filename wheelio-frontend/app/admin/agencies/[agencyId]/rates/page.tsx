"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminKeyValue, AdminPanel, AdminTip, adminMuted } from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findAgency, formatAdminTnd } from "@/lib/admin"
import { listedFromNet } from "@/lib/partner-pricing"
import { cn } from "@/lib/utils"

export default function AdminAgencyRatesPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session } = useAdminSession()
  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )

  if (!workspace || !session) {
    return (
      <AdminShell title="Rates">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!agency) {
    return (
      <AdminShell title="Rates">
        <p className="text-sm">Agency not found.</p>
      </AdminShell>
    )
  }

  const take = agency.takeRatePercent
  const exampleNet = 100
  const exampleListed = listedFromNet(exampleNet, take)

  const stubRates = [
    { category: "Economy", netDaily: 84, netWeekend: 97 },
    { category: "Compact", netDaily: 106, netWeekend: 119 },
    { category: "SUV", netDaily: 163, netWeekend: 185 },
  ]

  return (
    <AdminShell
      title="Rates"
      description={agency.tradeName}
      actions={
        <Link href={`/admin/agencies/${agency.id}`} className="text-sm font-medium underline">
          Command center
        </Link>
      }
    >
      <div className="w-full space-y-4">
        <AdminTip>
          Read-only stub. Customer listed trip price = agency net ÷ (1 − take rate). Deposit is
          never part of commission math.
        </AdminTip>

        <AdminPanel title="Pricing formula" hint={`Take rate ${take}% on this contract.`}>
          <AdminKeyValue
            rows={[
              {
                label: "Listed (search)",
                value: `net ÷ (1 − ${take / 100})`,
              },
              {
                label: "Example",
                value: `${formatAdminTnd(exampleNet)} net → ${formatAdminTnd(exampleListed)} listed`,
              },
              {
                label: "Wheelio fee on listed",
                value: formatAdminTnd(exampleListed - exampleNet),
              },
            ]}
          />
          <p className={cn("mt-3 text-sm", adminMuted)}>
            Agencies edit net targets in the portal. Wheelio fee applies to the listed trip total
            shown to travellers, not the security deposit.
          </p>
        </AdminPanel>

        <AdminPanel title="Sample net → listed (TND)">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("text-left text-xs uppercase", adminMuted)}>
                <th className="pb-2 font-semibold">Category</th>
                <th className="pb-2 font-semibold">Net weekday</th>
                <th className="pb-2 font-semibold">Listed weekday</th>
                <th className="pb-2 font-semibold">Net weekend</th>
                <th className="pb-2 font-semibold">Listed weekend</th>
              </tr>
            </thead>
            <tbody>
              {stubRates.map((r) => (
                <tr key={r.category} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 font-medium">{r.category}</td>
                  <td className="py-2 font-mono tabular-nums">{formatAdminTnd(r.netDaily)}</td>
                  <td className="py-2 font-mono tabular-nums">
                    {formatAdminTnd(listedFromNet(r.netDaily, take))}
                  </td>
                  <td className="py-2 font-mono tabular-nums">{formatAdminTnd(r.netWeekend)}</td>
                  <td className="py-2 font-mono tabular-nums">
                    {formatAdminTnd(listedFromNet(r.netWeekend, take))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
