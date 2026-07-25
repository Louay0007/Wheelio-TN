"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import { BookingStatusChip } from "@/components/agency/agency-ui"
import { useAgencySession } from "@/lib/agency-session"

export default function BookingsCalendarPage() {
  const { workspace } = useAgencySession()
  const bookings = [...(workspace?.bookings ?? [])].sort(
    (a, b) => new Date(a.pickupAt).getTime() - new Date(b.pickupAt).getTime(),
  )
  return (
    <AgencyShell title="Bookings calendar" description="Ops agenda by pickup time.">
      <ul className="space-y-2">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link href={`/agency/bookings/${b.id}`} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm">
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{new Date(b.pickupAt).toLocaleString()}</span>
              <span className="font-mono font-semibold">{b.reference}</span>
              <BookingStatusChip status={b.status} />
              <span>{b.customerName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AgencyShell>
  )
}
