"use client"

import { useEffect, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyPrimaryButton,
  AgencyTip,
} from "@/components/agency/agency-kit"
import {
  fetchAgencyFees,
  millimesToTnd,
  putAgencyFees,
} from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

const DEMO_FEES = [
  { name: "Airport counter", amount: 25, mandatory: true },
  { name: "After-hours", amount: 40, mandatory: true },
  { name: "Young driver", amount: 30, mandatory: true },
  { name: "One-way", amount: 80, mandatory: false },
  { name: "Hotel delivery", amount: 35, mandatory: false },
] as const

export default function FeesPage() {
  const api = useApiAgencySlice()
  const [fees, setFees] = useState<
    Awaited<ReturnType<typeof fetchAgencyFees>>
  >([])
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!api) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyFees()
      .then((rows) => {
        if (!cancelled) {
          setFees(rows)
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
  }, [api])

  async function seedDefaults() {
    setBusy(true)
    setError(null)
    try {
      await putAgencyFees(
        DEMO_FEES.map((f) => ({
          code: f.name.toLowerCase().replace(/\s+/g, "_"),
          nameEn: f.name,
          nameFr: f.name,
          amountMillimes: String(Math.round(f.amount * 1000)),
          mandatory: f.mandatory,
          active: true,
        })),
      )
      setFees(await fetchAgencyFees())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (api) {
    return (
      <AgencyShell
        title="Fees"
        description="Mandatory fees must appear in the customer total. Deposit is never a fee line."
      >
        <AgencyTip>
          includesDeposit is always false — deposit stays off GMV/commission.
        </AgencyTip>
        {loading ? (
          <div className="mt-4 h-24 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        ) : (
          <div className="mt-4 space-y-3">
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            {fees.length === 0 ? (
              <AgencyPrimaryButton
                type="button"
                disabled={busy}
                onClick={() => void seedDefaults()}
              >
                {busy ? "Saving…" : "Save starter fee catalog"}
              </AgencyPrimaryButton>
            ) : null}
            <ul className="space-y-2">
              {fees.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-[10px] border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700"
                >
                  <span>
                    {f.nameEn} · {f.mandatory ? "Mandatory" : "Optional"}
                    {!f.active ? " · inactive" : ""}
                  </span>
                  <span className="font-mono tabular-nums">
                    {millimesToTnd(f.amountMillimes).toFixed(3)} TND
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AgencyShell>
    )
  }

  return (
    <AgencyShell
      title="Fees"
      description="Mandatory fees must appear in the customer total."
    >
      <ul className="space-y-2">
        {DEMO_FEES.map((f) => (
          <li
            key={f.name}
            className="flex items-center justify-between rounded-[10px] border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700"
          >
            <span>
              {f.name} · {f.mandatory ? "Mandatory" : "Optional"}
            </span>
            <span className="font-mono tabular-nums">{f.amount} TND</span>
          </li>
        ))}
      </ul>
    </AgencyShell>
  )
}
