"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { formatAgencyTnd } from "@/lib/agency"

export default function PayoutDetailPage() {
  const { payoutId } = useParams<{ payoutId: string }>()
  const { workspace } = useAgencySession()
  const p = workspace?.payouts.find((x) => x.id === payoutId)
  if (!p) return <AgencyShell title="Payout"><Link href="/agency/payouts">Back</Link></AgencyShell>
  return (
    <AgencyShell title={p.periodLabel} description={`Status ${p.status}`}>
      <p className="font-mono text-lg">Net payable {formatAgencyTnd(p.netPayableTnd)}</p>
      <h2 className="mt-6 text-sm font-semibold">Included bookings</h2>
      <ul className="mt-2 space-y-2">
        {p.bookingIds.length === 0 ? <li className="text-sm text-zinc-600 dark:text-zinc-300">None linked in demo batch.</li> : null}
        {p.bookingIds.map((id) => {
          const b = workspace?.bookings.find((x) => x.id === id)
          return (
            <li key={id}>
              <Link href={`/agency/bookings/${id}`} className="text-sm underline">
                {b?.reference ?? id} · net {b ? formatAgencyTnd(b.agencyNetTnd) : "-"}
              </Link>
            </li>
          )
        })}
      </ul>
    </AgencyShell>
  )
}
