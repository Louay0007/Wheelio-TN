"use client"

import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

export default function BookingModePage() {
  const { workspace, updateWorkspace } = useAgencySession()
  const score = workspace?.qualityScore ?? 0
  const canInstant = score >= 85
  return (
    <AgencyShell title="Booking mode" description="New partners start on Request-to-book. Instant is quality-gated.">
      <div className="max-w-lg space-y-3">
        {(["request", "hybrid", "instant"] as const).map((mode) => {
          const locked = mode === "instant" && !canInstant
          return (
            <button
              key={mode}
              type="button"
              disabled={locked}
              onClick={() =>
                updateWorkspace((ws) => {
                  if (!ws) return ws
                  return {
                    ...ws,
                    bookingMode: mode,
                    onboardingDone: { ...ws.onboardingDone, booking_mode: true },
                  }
                })
              }
              className={`flex w-full cursor-pointer items-center justify-between rounded-[10px] border px-4 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                workspace?.bookingMode === mode
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <span className="capitalize font-semibold">{mode.replace("_", " ")}</span>
              {locked ? <span>Need quality ≥ 85 (now {score})</span> : null}
            </button>
          )
        })}
      </div>
    </AgencyShell>
  )
}
