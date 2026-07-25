"use client"

import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

export default function BlocksPage() {
  const { workspace, updateWorkspace } = useAgencySession()
  const [vehicleId, setVehicleId] = useState(workspace?.vehicles[0]?.id ?? "")
  const [label, setLabel] = useState("Maintenance")
  const [kind, setKind] = useState<"maintenance" | "owner_use" | "cleaning">("maintenance")

  return (
    <AgencyShell title="Calendar blocks" description="Cleaning, owner-use, and maintenance buffers prevent double booking.">
      <form
        className="max-w-lg space-y-3 rounded-[12px] border border-zinc-200 dark:border-zinc-700 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          updateWorkspace((ws) => {
            if (!ws) return ws
            return {
              ...ws,
              calendarBlocks: [
                ...ws.calendarBlocks,
                {
                  id: `blk-${Date.now()}`,
                  vehicleId,
                  label,
                  kind,
                  startLabel: "Today",
                  endLabel: "+1 day",
                },
              ],
            }
          })
          setLabel("")
        }}
      >
        <label className="block text-sm font-medium">Vehicle
          <select className="mt-1 h-11 w-full rounded-[8px] border border-zinc-200 dark:border-zinc-700 px-3" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {(workspace?.vehicles ?? []).map((v) => (
              <option key={v.id} value={v.id}>{v.plate} · {v.makeModel}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">Kind
          <select className="mt-1 h-11 w-full rounded-[8px] border border-zinc-200 dark:border-zinc-700 px-3" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="maintenance">Maintenance</option>
            <option value="owner_use">Owner use</option>
            <option value="cleaning">Cleaning</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Label
          <input className="mt-1 h-11 w-full rounded-[8px] border border-zinc-200 dark:border-zinc-700 px-3" value={label} onChange={(e) => setLabel(e.target.value)} required />
        </label>
        <button type="submit" className="h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">Add block</button>
      </form>
      <ul className="mt-6 space-y-2">
        {(workspace?.calendarBlocks ?? []).map((b) => (
          <li key={b.id} className="rounded-[8px] border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm">
            {b.kind} · {b.label} · vehicle {b.vehicleId}
          </li>
        ))}
      </ul>
    </AgencyShell>
  )
}
