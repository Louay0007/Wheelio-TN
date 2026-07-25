"use client"

import { useMemo } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminEmpty,
  AdminLinkButton,
  AdminPanel,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { cn } from "@/lib/utils"

export default function AdminSlaPage() {
  const { workspace, ready } = useAdminSession()

  const { expiring, expired, agencies } = useMemo(() => {
    if (!workspace) {
      return { expiring: [], expired: [], agencies: [] as { id: string; name: string; count: number }[] }
    }
    const now = Date.now()
    const requested = workspace.bookings.filter(
      (b) => b.status === "requested" && b.slaExpiresAt,
    )
    const expiring = requested
      .filter((b) => {
        const left = new Date(b.slaExpiresAt!).getTime() - now
        return left > 0 && left < 2 * 3600_000
      })
      .sort(
        (a, b) =>
          new Date(a.slaExpiresAt!).getTime() - new Date(b.slaExpiresAt!).getTime(),
      )
    const expired = requested
      .filter((b) => new Date(b.slaExpiresAt!).getTime() <= now)
      .concat(
        workspace.bookings.filter((b) => b.status === "expired"),
      )
      .slice(0, 20)
    const missMap = new Map<string, { id: string; name: string; count: number }>()
    for (const a of workspace.agencies) {
      if (a.openSlaBreaches > 0) {
        missMap.set(a.id, {
          id: a.id,
          name: a.tradeName,
          count: a.openSlaBreaches,
        })
      }
    }
    return {
      expiring,
      expired,
      agencies: [...missMap.values()].sort((a, b) => b.count - a.count),
    }
  }, [workspace])

  return (
    <AdminShell
      title="SLA monitor"
      description="Catch request-to-book deadlines before they expire."
    >
      {!ready || !workspace ? (
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full max-w-3xl space-y-4">
          <AdminPanel title="Expiring under 2 hours">
            {expiring.length === 0 ? (
              <p className={cn("text-sm", adminMuted)}>Nothing urgent right now.</p>
            ) : (
              <ul className="space-y-3">
                {expiring.map((b) => {
                  const mins = Math.max(
                    1,
                    Math.round(
                      (new Date(b.slaExpiresAt!).getTime() - Date.now()) / 60000,
                    ),
                  )
                  return (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800"
                    >
                      <div>
                        <p className="font-mono font-semibold">{b.reference}</p>
                        <p className={cn("text-sm", adminMuted)}>
                          {b.agencyName} · {b.customerName}
                        </p>
                        <p className={cn("text-xs", adminMutedSoft)}>
                          {mins} min left · {b.pickupLabel}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <AdminChip tone="strong">{mins}m</AdminChip>
                        <AdminLinkButton href={`/admin/bookings/${b.id}`}>
                          Booking
                        </AdminLinkButton>
                        <AdminLinkButton
                          href={`/admin/agencies/${b.agencyId}/quality`}
                          variant="secondary"
                        >
                          Quality
                        </AdminLinkButton>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </AdminPanel>

          <AdminPanel title="Expired / late">
            {expired.length === 0 ? (
              <AdminEmpty title="Clear" body="No expired request hits in this demo slice." />
            ) : (
              <ul className="space-y-2 text-sm">
                {expired.map((b) => (
                  <li key={b.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      <span className="font-mono font-semibold">{b.reference}</span>{" "}
                      <span className={adminMuted}>
                        {b.agencyName} · {b.status}
                      </span>
                    </span>
                    <AdminLinkButton
                      href={`/admin/bookings/${b.id}/messages`}
                      variant="secondary"
                    >
                      Message
                    </AdminLinkButton>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>

          <AdminPanel title="Agencies with repeated misses">
            {agencies.length === 0 ? (
              <p className={cn("text-sm", adminMuted)}>No repeat offenders seeded.</p>
            ) : (
              <ul className="space-y-2">
                {agencies.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{a.name}</span>
                    <AdminChip tone="strong">{a.count} breaches</AdminChip>
                    <AdminLinkButton
                      href={`/admin/agencies/${a.id}/quality`}
                      variant="secondary"
                    >
                      Restrict Instant
                    </AdminLinkButton>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </div>
      )}
    </AdminShell>
  )
}
