"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { fieldInputClass } from "@/components/account/password-fields"
import { fetchAgencyRate, millimesToTnd } from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"
import { listedFromNet } from "@/lib/partner-pricing"
import { formatAgencyTnd } from "@/lib/agency"

export default function RatePlanPage() {
  const { planId } = useParams<{ planId: string }>()
  const api = useApiAgencySlice()
  const { workspace, updateWorkspace } = useAgencySession()
  const plan = workspace?.ratePlans.find((p) => p.id === planId)
  const take = workspace?.takeRatePercent ?? 12
  const [net, setNet] = useState(plan?.netDayTnd ?? 95)
  const [apiPlan, setApiPlan] = useState<Awaited<
    ReturnType<typeof fetchAgencyRate>
  > | null>(null)
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!api || !planId) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyRate(planId)
      .then((row) => {
        if (!cancelled) {
          setApiPlan(row)
          setNet(millimesToTnd(row.netDailyMillimes))
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, planId])

  if (api) {
    if (loading) {
      return (
        <AgencyShell title="Rate">
          <div className="h-24 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
        </AgencyShell>
      )
    }
    if (error || !apiPlan) {
      return (
        <AgencyShell title="Rate">
          <p className="mb-3 text-sm text-red-600">{error}</p>
          <Link href="/agency/rates">Back</Link>
        </AgencyShell>
      )
    }
    return (
      <AgencyShell
        title={apiPlan.name}
        description="Read from API. Net edits need rate PATCH (coming); deposit stays excluded."
      >
        <p className="text-sm">
          Category {apiPlan.categoryCode} · min {apiPlan.minimumDays} day(s) ·{" "}
          {apiPlan.active ? "Active" : "Off"}
        </p>
        <p className="mt-3 text-sm">
          Net{" "}
          <span className="font-mono font-semibold">
            {formatAgencyTnd(millimesToTnd(apiPlan.netDailyMillimes))}
          </span>
          /day · listed preview{" "}
          <span className="font-mono font-semibold">
            {listedFromNet(millimesToTnd(apiPlan.netDailyMillimes), take)} TND
          </span>
          /day @{take}%
        </p>
      </AgencyShell>
    )
  }

  if (!plan)
    return (
      <AgencyShell title="Rate">
        <Link href="/agency/rates">Back</Link>
      </AgencyShell>
    )
  return (
    <AgencyShell
      title={plan.name}
      description="Edits apply to new offers only - old booking snapshots stay frozen."
    >
      <label className="block max-w-sm text-sm font-medium">
        Net day (TND)
        <input
          type="number"
          className={`${fieldInputClass} mt-1`}
          value={net}
          onChange={(e) => setNet(Number(e.target.value))}
        />
      </label>
      <p className="mt-3 text-sm">
        Listed preview:{" "}
        <span className="font-mono font-semibold">
          {listedFromNet(net, take)} TND
        </span>
        /day @{take}%
      </p>
      <button
        type="button"
        className="mt-4 h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
        onClick={() =>
          updateWorkspace((ws) => {
            if (!ws) return ws
            return {
              ...ws,
              ratePlans: ws.ratePlans.map((p) =>
                p.id === planId ? { ...p, netDayTnd: net } : p,
              ),
            }
          })
        }
      >
        Save
      </button>
    </AgencyShell>
  )
}
