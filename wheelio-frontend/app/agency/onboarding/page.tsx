"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { onboardingProgress, type OnboardingStepId } from "@/lib/agency"
import { putAgencyOnboardingStep } from "@/lib/gateways/agency"
import { useAgencyApiOnboarding } from "@/lib/hooks/use-agency-api-ops"

const STEPS: {
  id: OnboardingStepId
  label: string
  href: string
  mins: number
}[] = [
  {
    id: "profile",
    label: "Company profile & banking",
    href: "/agency/onboarding/profile",
    mins: 8,
  },
  {
    id: "documents",
    label: "Compliance documents",
    href: "/agency/onboarding/documents",
    mins: 10,
  },
  {
    id: "branch",
    label: "First branch + hours",
    href: "/agency/onboarding/branch",
    mins: 6,
  },
  {
    id: "fleet",
    label: "First vehicles + photos",
    href: "/agency/onboarding/fleet",
    mins: 15,
  },
  {
    id: "rates",
    label: "First rate plan",
    href: "/agency/onboarding/rates",
    mins: 5,
  },
  {
    id: "policies",
    label: "Core policies",
    href: "/agency/onboarding/policies",
    mins: 8,
  },
  {
    id: "booking_mode",
    label: "Booking mode (request)",
    href: "/agency/settings/booking-mode",
    mins: 3,
  },
  {
    id: "review",
    label: "Request activation",
    href: "/agency/onboarding/review",
    mins: 2,
  },
]

export default function OnboardingPage() {
  const { workspace, updateWorkspace } = useAgencySession()
  const api = useAgencyApiOnboarding()
  const demoProgress = workspace
    ? onboardingProgress(workspace)
    : { percent: 0, done: 0, total: 8 }

  const apiDone = new Set(
    (api.data?.steps ?? []).filter((s) => s.completed).map((s) => s.step),
  )
  const apiPercent = api.enabled
    ? Math.round((apiDone.size / STEPS.length) * 100)
    : demoProgress.percent

  return (
    <AgencyShell
      title="Onboarding"
      description={`listed = net ÷ (1 − 0.12). Deposit excluded. Progress ${apiPercent}%.`}
    >
      {api.error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {api.error}
        </p>
      ) : null}
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full bg-black dark:bg-white"
          style={{ width: `${apiPercent}%` }}
        />
      </div>
      <ul className="space-y-2">
        {STEPS.map((s) => {
          const done = api.enabled
            ? apiDone.has(s.id)
            : Boolean(workspace?.onboardingDone[s.id])
          return (
            <li key={s.id}>
              <Link
                href={s.href}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-zinc-200 px-4 py-3 dark:border-zinc-700"
              >
                <div>
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ~{s.mins} min · {done ? "Done" : "In progress"}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {done ? "✓" : "Open"}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        className="mt-6 h-11 cursor-pointer rounded-[8px] border border-zinc-200 px-4 text-sm font-semibold dark:border-zinc-700"
        onClick={() => {
          void (async () => {
            if (api.enabled) {
              for (const step of STEPS) {
                const existing = api.data?.steps.find((s) => s.step === step.id)
                await putAgencyOnboardingStep(
                  step.id,
                  { markedComplete: true },
                  existing?.version,
                )
              }
              window.location.reload()
              return
            }
            updateWorkspace((ws) => {
              if (!ws) return ws
              const onboardingDone = { ...ws.onboardingDone }
              ;(Object.keys(onboardingDone) as OnboardingStepId[]).forEach(
                (k) => {
                  onboardingDone[k] = true
                },
              )
              return { ...ws, onboardingDone }
            })
          })()
        }}
      >
        Mark all complete {api.enabled ? "(API)" : "(demo)"}
      </button>
    </AgencyShell>
  )
}
