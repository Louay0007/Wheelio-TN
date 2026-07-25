"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { AgencyEmptyState } from "@/components/agency/agency-ui"
import {
  AgencyInput,
  AgencyLinkButton,
  AgencyPanel,
  AgencySelect,
  AgencyStat,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import {
  fleetSummary,
  vehicleStatusLabel,
  type VehicleStatus,
} from "@/lib/agency"
import { useAgencyApiFleet } from "@/lib/hooks/use-agency-api-ops"
import { cn } from "@/lib/utils"

export default function FleetPage() {
  const { workspace, ready } = useAgencySession()
  const api = useAgencyApiFleet()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<VehicleStatus | "all">("all")
  const [branchId, setBranchId] = useState("all")

  const summary = workspace ? fleetSummary(workspace) : null
  const demoRows = useMemo(() => {
    if (!workspace) return []
    return workspace.vehicles
      .filter((v) => (status === "all" ? true : v.status === status))
      .filter((v) => (branchId === "all" ? true : v.branchId === branchId))
      .filter((v) => {
        const s = q.trim().toLowerCase()
        if (!s) return true
        return (
          v.makeModel.toLowerCase().includes(s) ||
          v.plate.toLowerCase().includes(s) ||
          v.category.toLowerCase().includes(s)
        )
      })
  }, [workspace, q, status, branchId])

  const apiRows = useMemo(() => {
    const items = api.items ?? []
    return items.filter((v) => {
      if (status !== "all" && v.status !== status) return false
      const s = q.trim().toLowerCase()
      if (!s) return true
      return (
        `${v.make} ${v.model}`.toLowerCase().includes(s) ||
        v.categoryCode.toLowerCase().includes(s)
      )
    })
  }, [api.items, q, status])

  const loading = api.enabled
    ? api.loading
    : !ready || !workspace || !summary

  return (
    <AgencyShell
      title="My cars"
      description="These cars appear in customer search. Keep photos and status up to date."
      actions={
        <>
          <AgencyLinkButton href="/agency/fleet/categories" variant="secondary">
            Car groups
          </AgencyLinkButton>
          <AgencyLinkButton href="/agency/fleet/new">Add car</AgencyLinkButton>
        </>
      }
    >
      {loading ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      ) : api.enabled ? (
        <div className="w-full space-y-4">
          {api.error ? (
            <p className="text-sm text-red-600" role="alert">
              {api.error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AgencyStat
              label="Fleet"
              value={String(api.items?.length ?? 0)}
            />
            <AgencyStat
              label="Ready"
              value={String(
                (api.items ?? []).filter((v) => v.status === "ready").length,
              )}
            />
            <AgencyStat
              label="On rent"
              value={String(
                (api.items ?? []).filter((v) => v.status === "on_rent").length,
              )}
            />
            <AgencyStat
              label="Other"
              value={String(
                (api.items ?? []).filter(
                  (v) => v.status !== "ready" && v.status !== "on_rent",
                ).length,
              )}
            />
          </div>
          <AgencyPanel>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
              <AgencyInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search model or category"
                aria-label="Search cars"
              />
              <AgencySelect
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as VehicleStatus | "all")
                }
              >
                <option value="all">All statuses</option>
                <option value="ready">Ready</option>
                <option value="on_rent">With customer</option>
                <option value="maintenance">Workshop</option>
                <option value="hidden">Hidden</option>
              </AgencySelect>
            </div>
          </AgencyPanel>
          <AgencyTip>
            Plate numbers stay private. Customers only see the model and category.
          </AgencyTip>
          {apiRows.length === 0 ? (
            <AgencyEmptyState
              title="No cars match"
              body="Try another search, or add your first car."
              action={
                <AgencyLinkButton href="/agency/fleet/new">
                  Add car
                </AgencyLinkButton>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {apiRows.map((v) => (
                <Link
                  key={v.id}
                  href={`/agency/fleet/${v.id}`}
                  className="rounded-[12px] border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
                >
                  <p className="font-semibold tracking-[-0.02em]">
                    {v.make} {v.model}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs uppercase tracking-[0.1em]",
                      agencyMuted,
                    )}
                  >
                    {v.status} · {v.categoryCode}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AgencyStat label="Ready" value={String(summary!.ready)} />
            <AgencyStat label="With customers" value={String(summary!.onRent)} />
            <AgencyStat label="Workshop" value={String(summary!.maintenance)} />
            <AgencyStat
              label="Need photos"
              value={String(summary!.needsPhotos)}
              hint="Aim for 4+ photos each"
            />
          </div>

          <AgencyPanel>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
              <AgencyInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search model, plate, or category"
                aria-label="Search cars"
              />
              <AgencySelect
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as VehicleStatus | "all")
                }
              >
                <option value="all">All statuses</option>
                <option value="ready">Ready</option>
                <option value="on_rent">With customer</option>
                <option value="maintenance">Workshop</option>
                <option value="hidden">Hidden</option>
              </AgencySelect>
              <AgencySelect
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              >
                <option value="all">All desks</option>
                {workspace!.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </AgencySelect>
            </div>
          </AgencyPanel>

          <AgencyTip>
            Plate numbers stay private. Customers only see the model and category.
          </AgencyTip>

          {demoRows.length === 0 ? (
            <AgencyEmptyState
              title="No cars match"
              body="Try another search, or add your first car."
              action={
                <AgencyLinkButton href="/agency/fleet/new">
                  Add car
                </AgencyLinkButton>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {demoRows.map((v) => (
                <Link
                  key={v.id}
                  href={`/agency/fleet/${v.id}`}
                  className="rounded-[12px] border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
                >
                  <div className="flex h-28 items-center justify-center rounded-[8px] bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {v.photoCount} photo{v.photoCount === 1 ? "" : "s"}
                  </div>
                  <p className="mt-3 font-semibold tracking-[-0.02em]">
                    {v.makeModel}
                  </p>
                  <p className="font-mono text-sm text-zinc-800 dark:text-zinc-100">
                    {v.plate}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs uppercase tracking-[0.1em]",
                      agencyMuted,
                    )}
                  >
                    {vehicleStatusLabel(v.status)} · {v.category}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </AgencyShell>
  )
}
