"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { fieldInputClass } from "@/components/account/password-fields"
import { createAgencyRate } from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"
import { listedFromNet } from "@/lib/partner-pricing"

export default function NewRatePage() {
  const router = useRouter()
  const api = useApiAgencySlice()
  const { workspace, updateWorkspace } = useAgencySession()
  const take = workspace?.takeRatePercent ?? 12
  const [name, setName] = useState("")
  const [net, setNet] = useState(95)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listed = listedFromNet(net, take)

  return (
    <AgencyShell title="New rate plan">
      <form
        className="max-w-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          void (async () => {
            setBusy(true)
            setError(null)
            try {
              if (api) {
                const plan = await createAgencyRate({
                  name,
                  categoryCode: "economy",
                  netDailyMillimes: String(Math.round(net * 1000)),
                  minimumDays: 1,
                })
                router.push(`/agency/rates/${plan.id}`)
                return
              }
              const id = `rp-${Date.now()}`
              updateWorkspace((ws) => {
                if (!ws) return ws
                return {
                  ...ws,
                  ratePlans: [
                    ...ws.ratePlans,
                    {
                      id,
                      name,
                      category: "Economy",
                      netDayTnd: net,
                      minDays: 1,
                      weekendUpliftPercent: 10,
                    },
                  ],
                  onboardingDone: { ...ws.onboardingDone, rates: true },
                }
              })
              router.push(`/agency/rates/${id}`)
            } catch (err) {
              setError(err instanceof Error ? err.message : "Save failed")
            } finally {
              setBusy(false)
            }
          })()
        }}
      >
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <label className="block text-sm font-medium">
          Name
          <input
            required
            className={`${fieldInputClass} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Net day (TND)
          <input
            type="number"
            className={`${fieldInputClass} mt-1`}
            value={net}
            onChange={(e) => setNet(Number(e.target.value))}
          />
        </label>
        <p className="rounded-[8px] border border-zinc-200 p-3 text-sm dark:border-zinc-700">
          Preview listed:{" "}
          <strong className="font-mono">{listed} TND</strong>/day at {take}%
          (deposit separate).
        </p>
        <button
          type="submit"
          disabled={busy}
          className="h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {busy ? "Saving…" : "Save plan"}
        </button>
      </form>
    </AgencyShell>
  )
}
