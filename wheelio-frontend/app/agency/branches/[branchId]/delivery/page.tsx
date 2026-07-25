"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

export default function DeliveryPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const { workspace } = useAgencySession()
  const b = workspace?.branches.find((x) => x.id === branchId)
  if (!b) return <AgencyShell title="Delivery"><Link href="/agency/branches">Back</Link></AgencyShell>
  const zones = [
    { name: "La Marsa / Gammarth", fee: 25 },
    { name: "Tunis centre", fee: 35 },
    { name: "Airport hotel strip", fee: 15 },
  ]
  return (
    <AgencyShell title={`Delivery · ${b.name}`}>
      <ul className="space-y-2">
        {zones.map((z) => (
          <li key={z.name} className="flex justify-between rounded-[8px] border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm">
            <span>{z.name}</span>
            <span className="font-mono">{z.fee} TND</span>
          </li>
        ))}
      </ul>
    </AgencyShell>
  )
}
