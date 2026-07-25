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
import { formatAgencyTnd } from "@/lib/agency"
import { millimesToTnd } from "@/lib/gateways/agency"
import { useAgencyApiRates } from "@/lib/hooks/use-agency-api-ops"
import { listedFromNet } from "@/lib/partner-pricing"
import { cn } from "@/lib/utils"

export default function RatesPage() {
  const { workspace, ready } = useAgencySession()
  const api = useAgencyApiRates()
  const take = workspace?.takeRatePercent ?? 12

  return (
    <AgencyShell
      title="Prices"
      description="You set what you keep (net). We show customers the full listed price with the Wheelio fee included."
      actions={
        <>
          <AgencyLinkButton href="/agency/rates/fees" variant="secondary">
            Extra fees
          </AgencyLinkButton>
          <AgencyLinkButton href="/agency/rates/preview" variant="secondary">
            Calculator
          </AgencyLinkButton>
          <AgencyLinkButton href="/agency/rates/new">New price plan</AgencyLinkButton>
        </>
      }
    >
      {(api.enabled ? api.loading : !ready || !workspace) ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          {api.error ? (
            <p className="text-sm text-red-600" role="alert">
              {api.error}
            </p>
          ) : null}
          <AgencyTip>
            Example: if your net is 95 TND/day and the fee is {take}%, the customer
            sees about {listedFromNet(95, take)} TND/day. Deposit is separate.
          </AgencyTip>

          <ul className="space-y-3">
            {api.enabled
              ? (api.items ?? []).map((p) => {
                  const net = millimesToTnd(p.netDailyMillimes)
                  const listed = listedFromNet(net, take)
                  return (
                    <li key={p.id}>
                      <Link href={`/agency/rates/${p.id}`} className="block">
                        <AgencyPanel>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold">{p.name}</p>
                              <p className={cn("mt-1 text-sm", agencyMuted)}>
                                {p.categoryCode} · {p.active ? "Active" : "Off"}
                              </p>
                            </div>
                            <div className="text-right font-mono text-sm tabular-nums">
                              <p className="text-zinc-500 dark:text-zinc-400">
                                You keep
                              </p>
                              <p className="text-lg font-semibold">
                                {formatAgencyTnd(net)}
                                <span className="text-sm font-normal">/day</span>
                              </p>
                              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                                Customer sees
                              </p>
                              <p className="font-semibold">
                                {formatAgencyTnd(listed)}
                                <span className="text-sm font-normal">/day</span>
                              </p>
                            </div>
                          </div>
                        </AgencyPanel>
                      </Link>
                    </li>
                  )
                })
              : workspace!.ratePlans.map((p) => {
                  const listed = listedFromNet(p.netDayTnd, take)
                  return (
                    <li key={p.id}>
                      <Link href={`/agency/rates/${p.id}`} className="block">
                        <AgencyPanel>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold">{p.name}</p>
                              <p className={cn("mt-1 text-sm", agencyMuted)}>
                                {p.category} · min {p.minDays} day
                                {p.minDays === 1 ? "" : "s"}
                              </p>
                            </div>
                            <div className="text-right font-mono text-sm tabular-nums">
                              <p className="text-zinc-500 dark:text-zinc-400">
                                You keep
                              </p>
                              <p className="text-lg font-semibold">
                                {formatAgencyTnd(p.netDayTnd)}
                                <span className="text-sm font-normal">/day</span>
                              </p>
                              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                                Customer sees
                              </p>
                              <p className="font-semibold">
                                {formatAgencyTnd(listed)}
                                <span className="text-sm font-normal">/day</span>
                              </p>
                            </div>
                          </div>
                        </AgencyPanel>
                      </Link>
                    </li>
                  )
                })}
          </ul>
        </div>
      )}
    </AgencyShell>
  )
}
