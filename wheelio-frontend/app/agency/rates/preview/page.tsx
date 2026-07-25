"use client"

import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { listedFromNet, PARTNER_PRICING } from "@/lib/partner-pricing"

export default function RatePreviewPage() {
  const { workspace } = useAgencySession()
  const [net, setNet] = useState<number>(PARTNER_PRICING.exampleAgencyNetDayTnd)
  const take = workspace?.takeRatePercent ?? PARTNER_PRICING.recommendedPercent
  const listed = listedFromNet(net, take)
  return (
    <AgencyShell title="Net → listed calculator" description="listed = net ÷ (1 − takeRate). Deposit excluded.">
      <label className="block max-w-sm text-sm font-medium">Agency net / day (TND)
        <input type="number" className="mt-1 h-11 w-full rounded-[8px] border border-zinc-200 dark:border-zinc-700 px-3" value={net} onChange={(e) => setNet(Number(e.target.value))} />
      </label>
      <div className="mt-4 grid max-w-md gap-3 sm:grid-cols-3">
        <div className="rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-3"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Net</p><p className="font-mono text-xl font-semibold">{net}</p></div>
        <div className="rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-3"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Listed @{take}%</p><p className="font-mono text-xl font-semibold">{listed}</p></div>
        <div className="rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-3"><p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Commission</p><p className="font-mono text-xl font-semibold">{listed - net}</p></div>
      </div>
    </AgencyShell>
  )
}
