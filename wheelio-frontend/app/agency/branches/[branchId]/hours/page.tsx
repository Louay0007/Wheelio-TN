"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function BranchHoursPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const { workspace } = useAgencySession()
  const b = workspace?.branches.find((x) => x.id === branchId)
  if (!b) return <AgencyShell title="Hours"><Link href="/agency/branches">Back</Link></AgencyShell>
  return (
    <AgencyShell title={`Hours · ${b.name}`} description={b.hoursLabel}>
      <div className="max-w-md space-y-2">
        {DAYS.map((d) => (
          <div key={d} className="flex items-center justify-between rounded-[8px] border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm">
            <span className="font-medium">{d}</span>
            <span className="font-mono text-zinc-600 dark:text-zinc-300">09:00 - 18:00</span>
          </div>
        ))}
      </div>
    </AgencyShell>
  )
}
