"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyInput,
  AgencyPrimaryButton,
  AgencyTip,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import {
  attachVehicleMedia,
  createUploadIntent,
  deleteVehicleMedia,
  fetchVehicleMedia,
  finalizeUpload,
} from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

export default function VehiclePhotosPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const api = useApiAgencySlice()
  const { workspace } = useAgencySession()
  const v = workspace?.vehicles.find((x) => x.id === vehicleId)
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof fetchVehicleMedia>>
  >([])
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!api) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchVehicleMedia(vehicleId)
      .then((rows) => {
        if (!cancelled) {
          setItems(rows)
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

  async function upload() {
    if (!file || busy) return
    setBusy(true)
    setError(null)
    try {
      const intent = await createUploadIntent({
        purpose: "vehicle_media",
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
        classification: "public",
      })
      const put = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: intent.headers,
        body: file,
      })
      if (!put.ok) throw new Error(`MinIO upload failed (${put.status})`)
      await finalizeUpload(intent.objectId)
      await attachVehicleMedia(vehicleId, {
        storedObjectId: intent.objectId,
        kind: "photo",
      })
      setItems(await fetchVehicleMedia(vehicleId))
      setFile(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  async function remove(mediaId: string) {
    setBusy(true)
    try {
      await deleteVehicleMedia(vehicleId, mediaId)
      setItems(await fetchVehicleMedia(vehicleId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  if (api) {
    return (
      <AgencyShell title="Photos">
        <AgencyTip>
          Presigned MinIO upload → finalize (scan stub) → attach to vehicle.
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
            <div className="flex flex-wrap items-end gap-3">
              <AgencyInput
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                aria-label="Photo file"
              />
              <AgencyPrimaryButton
                type="button"
                disabled={!file || busy}
                onClick={() => void upload()}
              >
                {busy ? "Uploading…" : "Upload"}
              </AgencyPrimaryButton>
            </div>
            <ul className="space-y-2 text-sm">
              {items.length === 0 ? (
                <li className="text-zinc-500">No photos yet.</li>
              ) : (
                items.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-[8px] border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                  >
                    <span>
                      {m.kind} · {m.moderationState}
                      {m.caption ? ` · ${m.caption}` : ""}
                    </span>
                    <button
                      type="button"
                      className="text-xs underline"
                      disabled={busy}
                      onClick={() => void remove(m.id)}
                    >
                      Remove
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

  return (
    <AgencyShell title="Photos">
      {!v ? (
        <p className="text-sm">Vehicle not found</p>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Demo: {v.makeModel} has {v.photoCount} photos. Enable the agency API
          slice for MinIO-backed media.
        </p>
      )}
    </AgencyShell>
  )
}
