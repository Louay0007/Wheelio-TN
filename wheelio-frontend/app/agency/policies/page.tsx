"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { AgencyTip } from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { fetchAgencyPolicies } from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

const LINKS = [
  ["cancellation", "Cancellation"],
  ["mileage", "Mileage"],
  ["fuel", "Fuel"],
  ["deposit", "Deposit"],
  ["drivers", "Drivers"],
  ["protection", "Protection"],
] as const

export default function PoliciesHubPage() {
  const api = useApiAgencySlice()
  const { workspace } = useAgencySession()
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof fetchAgencyPolicies>>
  >([])
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!api) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyPolicies()
      .then((items) => {
        if (!cancelled) {
          setRows(items)
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

  const summaryByKind = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of rows) {
      if (r.locale === "en" && !map.has(r.kind)) map.set(r.kind, r.summary)
    }
    return map
  }, [rows])

  return (
    <AgencyShell
      title="Policies"
      description="Plain-language summaries customers see on offers. Changes apply to new offers only."
    >
      {api ? (
        <>
          <AgencyTip>EN/FR policy packs · optimistic versioning on save.</AgencyTip>
          {loading ? (
            <div className="mt-4 h-32 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
          ) : (
            <div className="mt-4 space-y-3">
              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
              <ul className="grid gap-3 sm:grid-cols-2">
                {LINKS.map(([id, label]) => (
                  <li key={id}>
                    <Link
                      href={`/agency/policies/${id}`}
                      className="block rounded-[12px] border border-zinc-200 p-4 dark:border-zinc-700"
                    >
                      <p className="font-semibold">{label}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {summaryByKind.get(id) ?? "Not set yet"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {LINKS.map(([id, label]) => (
            <li key={id}>
              <Link
                href={`/agency/policies/${id}`}
                className="block rounded-[12px] border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <p className="font-semibold">{label}</p>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {workspace?.policies[id]}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AgencyShell>
  )
}
