"use client"

import { AgencyShell } from "@/components/agency/agency-shell"

export default function InvoicesPage() {
  const invoices = [
    { id: "INV-2026-06", label: "June commission", amount: "494 TND" },
    { id: "INV-2026-07a", label: "July 1-15 (draft)", amount: "634 TND" },
  ]
  return (
    <AgencyShell title="Invoices" description="Wheelio → agency commission invoices (PDF stubs).">
      <ul className="space-y-2">
        {invoices.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between rounded-[10px] border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm">
            <span><span className="font-mono font-semibold">{inv.id}</span> · {inv.label}</span>
            <button type="button" className="cursor-pointer underline">{inv.amount} · Download</button>
          </li>
        ))}
      </ul>
    </AgencyShell>
  )
}
