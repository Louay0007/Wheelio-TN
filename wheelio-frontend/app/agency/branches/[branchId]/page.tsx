"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

export default function BranchDetailPage() {
  const { branchId } = useParams<{ branchId: string }>()
  const { workspace } = useAgencySession()
  const b = workspace?.branches.find((x) => x.id === branchId)
  if (!b) return <AgencyShell title="Branch"><Link href="/agency/branches">Back</Link></AgencyShell>
  return (
    <AgencyShell title={b.name} description={b.address}>
      <p className="text-sm">{b.city} · {b.phone}</p>
      <p className="mt-2 text-sm">Methods: {b.pickupMethods.join(", ")}</p>
      <div className="mt-4 flex gap-3 text-sm">
        <Link href={`/agency/branches/${b.id}/hours`} className="underline">Hours</Link>
        <Link href={`/agency/branches/${b.id}/delivery`} className="underline">Delivery zones</Link>
      </div>
    </AgencyShell>
  )
}
