"use client"

import { useEffect, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyPrimaryButton,
  AgencySelect,
  AgencyTip,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { fetchAgencyPolicies, putAgencyPolicy } from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

const TITLES: Record<string, string> = {
  cancellation: "Cancellation policy",
  mileage: "Mileage policy",
  fuel: "Fuel policy",
  deposit: "Deposit policy",
  drivers: "Drivers policy",
  protection: "Protection policy",
}

export function AgencyPolicyEditor({
  kind,
}: {
  kind:
    | "cancellation"
    | "mileage"
    | "fuel"
    | "deposit"
    | "drivers"
    | "protection"
}) {
  const api = useApiAgencySlice()
  const { workspace, updateWorkspace } = useAgencySession()
  const [locale, setLocale] = useState<"en" | "fr">("en")
  const [summary, setSummary] = useState("")
  const [version, setVersion] = useState<number | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!api) {
      setSummary(workspace?.policies[kind] ?? "")
      return
    }
    let cancelled = false
    fetchAgencyPolicies()
      .then((rows) => {
        if (cancelled) return
        const row = rows.find((r) => r.kind === kind && r.locale === locale)
        setSummary(row?.summary ?? "")
        setVersion(row?.version)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
        }
      })
    return () => {
      cancelled = true
    }
  }, [api, kind, locale, workspace?.policies])

  async function saveApi() {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const res = await putAgencyPolicy(kind, {
        locale,
        summary,
        expectedVersion: version,
      })
      setVersion(res.version)
      setSaved(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AgencyShell
      title={TITLES[kind] ?? "Policy"}
      description="Customer-facing summary required. Preview how it appears on the offer page."
    >
      {api ? (
        <>
          <AgencyTip>Locale-scoped revisions · EN/FR only.</AgencyTip>
          <div className="mt-3 max-w-xs">
            <AgencySelect
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "fr")}
              aria-label="Locale"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </AgencySelect>
          </div>
        </>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <textarea
        className="mt-4 min-h-40 w-full max-w-2xl rounded-[10px] border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
      <div className="mt-4 max-w-2xl rounded-[10px] border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-600">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
          Offer page preview
        </p>
        <p className="mt-2">{summary || "-"}</p>
      </div>
      <AgencyPrimaryButton
        type="button"
        className="mt-4"
        disabled={busy || !summary.trim()}
        onClick={() => {
          if (api) {
            void saveApi()
            return
          }
          updateWorkspace((ws) => {
            if (!ws) return ws
            return {
              ...ws,
              policies: { ...ws.policies, [kind]: summary },
              onboardingDone: { ...ws.onboardingDone, policies: true },
            }
          })
          setSaved(true)
        }}
      >
        {busy ? "Saving…" : "Save policy"}
      </AgencyPrimaryButton>
      {saved ? (
        <p className="mt-2 text-sm text-zinc-500">Saved.</p>
      ) : null}
    </AgencyShell>
  )
}
