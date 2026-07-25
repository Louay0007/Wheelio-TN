"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { fieldInputClass } from "@/components/account/password-fields"
import { createAgencyBranch } from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

export default function NewBranchPage() {
  const router = useRouter()
  const api = useApiAgencySlice()
  const { updateWorkspace } = useAgencySession()
  const [name, setName] = useState("")
  const [city, setCity] = useState("Tunis")
  const [address, setAddress] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <AgencyShell title="New branch">
      <form
        className="max-w-lg space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          void (async () => {
            setBusy(true)
            setError(null)
            try {
              if (api) {
                const branch = await createAgencyBranch({
                  name,
                  city,
                  addressLine: address,
                })
                router.push(`/agency/branches/${branch.id}`)
                return
              }
              const id = `br-${Date.now()}`
              updateWorkspace((ws) => {
                if (!ws) return ws
                return {
                  ...ws,
                  branches: [
                    ...ws.branches,
                    {
                      id,
                      name,
                      city,
                      address,
                      phone: "+216 ",
                      pickupMethods: ["counter"],
                      hoursLabel: "09:00-18:00",
                    },
                  ],
                  onboardingDone: { ...ws.onboardingDone, branch: true },
                }
              })
              router.push(`/agency/branches/${id}`)
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
          City
          <input
            className={`${fieldInputClass} mt-1`}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Address
          <input
            required
            className={`${fieldInputClass} mt-1`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </AgencyShell>
  )
}
