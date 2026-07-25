"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { fieldInputClass } from "@/components/account/password-fields"
import {
  fetchAgencyVehicle,
  updateAgencyVehicle,
} from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

export default function VehicleDetailPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const api = useApiAgencySlice()
  const { workspace, updateWorkspace } = useAgencySession()
  const demo = workspace?.vehicles.find((x) => x.id === vehicleId)
  const [row, setRow] = useState<Awaited<
    ReturnType<typeof fetchAgencyVehicle>
  > | null>(null)
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!api || !vehicleId) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyVehicle(vehicleId)
      .then((v) => {
        if (!cancelled) {
          setRow(v)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setRow(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, vehicleId])

  if (api) {
    if (loading) {
      return (
        <AgencyShell title="Vehicle">
          <div className="h-32 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
        </AgencyShell>
      )
    }
    if (error || !row) {
      return (
        <AgencyShell title="Vehicle">
          <p className="mb-3 text-sm text-red-600">{error}</p>
          <Link href="/agency/fleet">Back</Link>
        </AgencyShell>
      )
    }
    return (
      <AgencyShell
        title={`${row.make} ${row.model}`}
        description={row.categoryCode}
        actions={
          <Link
            href={`/agency/fleet/${row.id}/photos`}
            className="inline-flex h-11 items-center rounded-[8px] border border-zinc-200 px-4 text-sm font-semibold dark:border-zinc-700"
          >
            Photos
          </Link>
        }
      >
        <form
          className="max-w-lg space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            void (async () => {
              setBusy(true)
              setError(null)
              try {
                const makeModel = String(fd.get("makeModel") || "")
                const parts = makeModel.trim().split(/\s+/)
                const updated = await updateAgencyVehicle(row.id, {
                  expectedVersion: row.version,
                  make: parts[0] ?? row.make,
                  model: parts.slice(1).join(" ") || row.model,
                  status: String(fd.get("status") || row.status) as
                    | "ready"
                    | "on_rent"
                    | "maintenance"
                    | "hidden",
                })
                setRow({
                  ...row,
                  make: parts[0] ?? row.make,
                  model: parts.slice(1).join(" ") || row.model,
                  status: updated.status,
                  version: updated.version,
                })
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
            Make & model
            <input
              name="makeModel"
              defaultValue={`${row.make} ${row.model}`}
              className={`${fieldInputClass} mt-1`}
            />
          </label>
          <label className="block text-sm font-medium">
            Status
            <select
              name="status"
              defaultValue={row.status}
              className={`${fieldInputClass} mt-1`}
            >
              {["ready", "on_rent", "maintenance", "hidden"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <Link
            href={`/agency/fleet/${row.id}/availability`}
            className="ml-3 text-sm underline"
          >
            Per-car availability
          </Link>
        </form>
      </AgencyShell>
    )
  }

  if (!demo)
    return (
      <AgencyShell title="Vehicle">
        <Link href="/agency/fleet">Back</Link>
      </AgencyShell>
    )

  return (
    <AgencyShell
      title={demo.makeModel}
      description={`Plate ${demo.plate}`}
      actions={
        <Link
          href={`/agency/fleet/${demo.id}/photos`}
          className="inline-flex h-11 items-center rounded-[8px] border border-zinc-200 px-4 text-sm font-semibold dark:border-zinc-700"
        >
          Photos
        </Link>
      }
    >
      <form
        className="max-w-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          updateWorkspace((ws) => {
            if (!ws) return ws
            return {
              ...ws,
              vehicles: ws.vehicles.map((x) =>
                x.id === demo.id
                  ? {
                      ...x,
                      makeModel: String(fd.get("makeModel") || x.makeModel),
                      status: String(fd.get("status") || x.status) as typeof x.status,
                    }
                  : x,
              ),
            }
          })
        }}
      >
        <label className="block text-sm font-medium">
          Make & model
          <input
            name="makeModel"
            defaultValue={demo.makeModel}
            className={`${fieldInputClass} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={demo.status}
            className={`${fieldInputClass} mt-1`}
          >
            {["ready", "on_rent", "maintenance", "hidden"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
        >
          Save
        </button>
      </form>
    </AgencyShell>
  )
}
