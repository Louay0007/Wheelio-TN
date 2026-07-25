"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyLinkButton,
  AgencyPanel,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { findVehicle, vehicleStatusLabel } from "@/lib/agency"
import { cn } from "@/lib/utils"

export default function AgencyCalendarPage() {
  const { workspace, ready } = useAgencySession()
  const vehicles = workspace?.vehicles ?? []
  const bookings =
    workspace?.bookings.filter((b) =>
      ["confirmed", "active", "held", "requested"].includes(b.status),
    ) ?? []
  const blocks = workspace?.calendarBlocks ?? []

  return (
    <AgencyShell
      title="Car calendar"
      description="See which cars are free, booked, or blocked for cleaning and repairs."
      actions={
        <AgencyLinkButton href="/agency/calendar/blocks" variant="secondary">
          Add a block
        </AgencyLinkButton>
      }
    >
      {!ready || !workspace ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          <AgencyTip>
            A block keeps a car off the calendar (service, owner use, or cleaning).
            This helps avoid double bookings.
          </AgencyTip>

          <div className="space-y-3">
            {vehicles.map((v) => {
              const vb = bookings.filter((b) => b.vehicleId === v.id)
              const vbBlocks = blocks.filter((b) => b.vehicleId === v.id)
              return (
                <AgencyPanel key={v.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {v.makeModel}{" "}
                        <span className="font-mono text-sm font-normal">
                          {v.plate}
                        </span>
                      </p>
                      <p className={cn("text-xs uppercase tracking-[0.1em]", agencyMuted)}>
                        {vehicleStatusLabel(v.status)}
                      </p>
                    </div>
                    <Link
                      href={`/agency/fleet/${v.id}`}
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      Edit car
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vb.map((b) => (
                      <Link
                        key={b.id}
                        href={`/agency/bookings/${b.id}`}
                        className="rounded-[7px] border border-zinc-950 bg-zinc-950/5 px-2 py-1 text-xs font-medium dark:border-zinc-50 dark:bg-zinc-50/10"
                      >
                        {b.reference} · {b.status.replaceAll("_", " ")}
                      </Link>
                    ))}
                    {vbBlocks.map((b) => (
                      <span
                        key={b.id}
                        className="rounded-[7px] border border-dashed border-zinc-400 px-2 py-1 text-xs dark:border-zinc-500"
                      >
                        {b.kind.replaceAll("_", " ")}: {b.label} ({b.startLabel} →{" "}
                        {b.endLabel})
                      </span>
                    ))}
                    {vb.length === 0 && vbBlocks.length === 0 ? (
                      <span className={cn("text-xs", agencyMuted)}>
                        Open - no bookings on this car
                      </span>
                    ) : null}
                  </div>
                </AgencyPanel>
              )
            })}
          </div>

          <AgencyPanel title="Soonest pickups">
            <ul className="space-y-2 text-sm">
              {bookings.slice(0, 8).map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/agency/bookings/${b.id}`}
                    className="underline underline-offset-4"
                  >
                    {b.pickupLabel} · {b.reference} ·{" "}
                    {findVehicle(workspace, b.vehicleId)?.plate ?? "no plate yet"}
                  </Link>
                </li>
              ))}
            </ul>
          </AgencyPanel>
        </div>
      )}
    </AgencyShell>
  )
}
