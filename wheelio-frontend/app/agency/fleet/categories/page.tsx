"use client"

import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

export default function CategoriesPage() {
  const { workspace } = useAgencySession()
  const pools = new Map<string, string[]>()
  for (const v of workspace?.vehicles ?? []) {
    if (!v.poolId) continue
    pools.set(v.poolId, [...(pools.get(v.poolId) ?? []), `${v.makeModel} (${v.plate})`])
  }
  return (
    <AgencyShell title="Category pools" description="“Or similar” groups for pooled inventory.">
      {[...pools.entries()].map(([id, cars]) => (
        <div key={id} className="mb-4 rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-4">
          <p className="font-semibold">{id}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">{cars.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      ))}
      {pools.size === 0 ? <p className="text-sm">No pools yet - assign poolId on vehicles.</p> : null}
    </AgencyShell>
  )
}
