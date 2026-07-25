"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyInput,
  AgencyPrimaryButton,
  AgencySelect,
  AgencyTip,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  fetchAvailabilityBlocks,
} from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

export default function VehicleAvailabilityPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const api = useApiAgencySlice()
  const { workspace } = useAgencySession()
  const v = workspace?.vehicles.find((x) => x.id === vehicleId)
  const demoBlocks =
    workspace?.calendarBlocks.filter((b) => b.vehicleId === vehicleId) ?? []

  const [blocks, setBlocks] = useState<
    Awaited<ReturnType<typeof fetchAvailabilityBlocks>>
  >([])
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [label, setLabel] = useState("Maintenance")
  const [kind, setKind] = useState<
    "maintenance" | "owner_use" | "hold" | "other"
  >("maintenance")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")

  useEffect(() => {
    if (!api) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAvailabilityBlocks(vehicleId)
      .then((rows) => {
        if (!cancelled) {
          setBlocks(rows)
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
  }, [api, vehicleId])

  async function addBlock() {
    if (!startsAt || !endsAt || busy) return
    setBusy(true)
    setError(null)
    try {
      await createAvailabilityBlock({
        vehicleId,
        kind,
        label,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      })
      setBlocks(await fetchAvailabilityBlocks(vehicleId))
      setLabel("Maintenance")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create failed")
    } finally {
      setBusy(false)
    }
  }

  async function remove(blockId: string) {
    setBusy(true)
    try {
      await deleteAvailabilityBlock(blockId)
      setBlocks(await fetchAvailabilityBlocks(vehicleId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  if (api) {
    return (
      <AgencyShell title="Availability">
        <AgencyTip>
          Active blocks exclude the vehicle from sellable windows (calendar
          ops).
        </AgencyTip>
        {loading ? (
          <div className="mt-4 h-24 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        ) : (
          <div className="mt-4 space-y-4">
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <AgencyInput
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label"
                aria-label="Block label"
              />
              <AgencySelect
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as typeof kind)
                }
                aria-label="Block kind"
              >
                <option value="maintenance">Maintenance</option>
                <option value="owner_use">Owner use</option>
                <option value="hold">Hold</option>
                <option value="other">Other</option>
              </AgencySelect>
              <AgencyInput
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                aria-label="Starts at"
              />
              <AgencyInput
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                aria-label="Ends at"
              />
            </div>
            <AgencyPrimaryButton
              type="button"
              disabled={busy || !startsAt || !endsAt}
              onClick={() => void addBlock()}
            >
              Add block
            </AgencyPrimaryButton>
            <ul className="space-y-2 text-sm">
              {blocks.length === 0 ? (
                <li className="text-zinc-500">No active blocks.</li>
              ) : (
                blocks.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-[8px] border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                  >
                    <span>
                      {b.kind}: {b.label} ·{" "}
                      {new Date(b.startsAt).toLocaleString()} →{" "}
                      {new Date(b.endsAt).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      className="text-xs underline"
                      disabled={busy}
                      onClick={() => void remove(b.id)}
                    >
                      Cancel
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </AgencyShell>
    )
  }

  if (!v) {
    return (
      <AgencyShell title="Availability">
        <Link href="/agency/fleet">Back</Link>
      </AgencyShell>
    )
  }
  return (
    <AgencyShell title={`Availability · ${v.plate}`}>
      <ul className="space-y-2 text-sm">
        {demoBlocks.length === 0 ? (
          <li>No blocks - open in fleet calendar.</li>
        ) : (
          demoBlocks.map((b) => (
            <li
              key={b.id}
              className="rounded-[8px] border border-zinc-200 px-3 py-2 dark:border-zinc-700"
            >
              {b.kind}: {b.label}
            </li>
          ))
        )}
      </ul>
      <Link
        href="/agency/calendar/blocks"
        className="mt-4 inline-flex text-sm underline"
      >
        Add block
      </Link>
    </AgencyShell>
  )
}
