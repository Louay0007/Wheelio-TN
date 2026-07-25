"use client"

import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { formatAgencyTnd } from "@/lib/agency"

export default function LedgerPage() {
  const { workspace } = useAgencySession()
  const take = workspace?.takeRatePercent ?? 12
  const events = [
    { label: "Commission accrual · completed trips", amount: 494 },
    { label: "Payout batch Jun 16-30", amount: -3626 },
    { label: `Open accrual @ ${take}% (scheduled)`, amount: 634 },
  ]
  return (
    <AgencyShell title="Ledger" description="Immutable money events. Deposits never appear as GMV.">
      <ul className="divide-y divide-black/10 rounded-[12px] border border-zinc-200 dark:border-zinc-700 dark:divide-white/10">
        {events.map((e) => (
          <li key={e.label} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{e.label}</span>
            <span className="font-mono tabular-nums">{formatAgencyTnd(e.amount)}</span>
          </li>
        ))}
      </ul>
    </AgencyShell>
  )
}
