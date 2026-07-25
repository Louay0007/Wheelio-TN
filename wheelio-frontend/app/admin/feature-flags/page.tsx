"use client"

import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminPanel,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"

const DEMO_FLAGS = [
  {
    id: "instant_booking_v2",
    label: "Instant booking v2",
    description: "New hold timer UX on customer checkout.",
    enabled: false,
  },
  {
    id: "agency_chat_beta",
    label: "Agency chat beta",
    description: "In-app messaging between agency and customer.",
    enabled: true,
  },
  {
    id: "finance_ledger_export",
    label: "Ledger CSV export",
    description: "Real export instead of alert stub.",
    enabled: false,
  },
] as const

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState(
    DEMO_FLAGS.map((f) => ({ ...f, on: f.enabled })),
  )

  return (
    <AdminShell
      title="Feature flags"
      description="Demo toggles only. Not connected to production config."
    >
      <AdminChip tone="warn">Non-production</AdminChip>
      <div className="mt-3">
        <AdminTip>
          Changes here affect this browser session only. Ship real flags via your deployment
          pipeline.
        </AdminTip>
      </div>

      <ul className="mt-4 space-y-3">
        {flags.map((f, i) => (
          <li key={f.id}>
            <AdminPanel
              title={f.label}
              action={
                <button
                  type="button"
                  className="text-sm font-semibold underline underline-offset-4"
                  onClick={() =>
                    setFlags((prev) =>
                      prev.map((row, j) => (j === i ? { ...row, on: !row.on } : row)),
                    )
                  }
                >
                  {f.on ? "On" : "Off"}
                </button>
              }
            >
              <p className={`text-sm ${adminMuted}`}>{f.description}</p>
              <p className="mt-2 font-mono text-xs text-zinc-500">{f.id}</p>
            </AdminPanel>
          </li>
        ))}
      </ul>
    </AdminShell>
  )
}
