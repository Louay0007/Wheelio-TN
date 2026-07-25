"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

const GATES = [
  { label: "Acceptance rate", value: "≥ 90%", met: true },
  { label: "Median response", value: "≤ 4h desk", met: true },
  { label: "Agency cancels", value: "< 3%", met: true },
  { label: "Inventory accuracy", value: "High", met: false },
  { label: "Complaints", value: "Low", met: true },
  { label: "Reviews", value: "≥ 4.2", met: true },
]

export default function QualityPage() {
  const { workspace } = useAgencySession()
  return (
    <AgencyShell title="Quality scorecard" description={`Score ${workspace?.qualityScore}. Instant stays locked until gates are green.`}>
      <ul className="space-y-2">
        {GATES.map((g) => (
          <li key={g.label} className="flex items-center justify-between rounded-[10px] border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm">
            <span>{g.label} · {g.value}</span>
            <span className="font-semibold">{g.met ? "Met" : "Improve"}</span>
          </li>
        ))}
      </ul>
      <Link href="/agency/settings/booking-mode" className="mt-6 inline-flex text-sm underline">Booking mode settings</Link>
    </AgencyShell>
  )
}
