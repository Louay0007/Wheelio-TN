"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { fieldInputClass } from "@/components/account/password-fields"
import { createAgencyVehicle } from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

const CATEGORY_MAP: Record<string, string> = {
  Economy: "economy",
  Compact: "compact",
  Intermediate: "intermediate",
  SUV: "suv",
  Van: "van",
}

export default function NewVehiclePage() {
  const router = useRouter()
  const api = useApiAgencySlice()
  const { updateWorkspace } = useAgencySession()
  const [makeModel, setMakeModel] = useState("")
  const [plate, setPlate] = useState("")
  const [category, setCategory] = useState("Economy")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <AgencyShell title="Add vehicle">
      <form
        className="max-w-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          void (async () => {
            setBusy(true)
            setError(null)
            try {
              if (api) {
                const parts = makeModel.trim().split(/\s+/)
                const make = parts[0] ?? makeModel
                const model = parts.slice(1).join(" ") || make
                const vehicle = await createAgencyVehicle({
                  categoryCode: CATEGORY_MAP[category] ?? "economy",
                  make,
                  model,
                  year: 2024,
                  plateHint: plate,
                })
                router.push(`/agency/fleet/${vehicle.id}`)
                return
              }
              const id = `vh-${Date.now()}`
              updateWorkspace((ws) => {
                if (!ws) return ws
                return {
                  ...ws,
                  vehicles: [
                    ...ws.vehicles,
                    {
                      id,
                      plate,
                      makeModel,
                      year: 2024,
                      category,
                      transmission: "manual",
                      fuel: "Petrol",
                      seats: 5,
                      bags: 2,
                      branchId: ws.branches[0]?.id ?? "br-tunis",
                      status: "ready",
                      photoCount: 0,
                    },
                  ],
                  onboardingDone: { ...ws.onboardingDone, fleet: true },
                }
              })
              router.push(`/agency/fleet/${id}/photos`)
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
            required
            className={`${fieldInputClass} mt-1`}
            value={makeModel}
            onChange={(e) => setMakeModel(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Plate (private)
          <input
            required
            className={`${fieldInputClass} mt-1 font-mono`}
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Category
          <select
            className={`${fieldInputClass} mt-1`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["Economy", "Compact", "Intermediate", "SUV", "Van"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {busy ? "Saving…" : "Save & add photos"}
        </button>
      </form>
    </AgencyShell>
  )
}
