"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

export default function OnboardingRatesPage() {
  const { updateWorkspace } = useAgencySession()
  return (
    <AgencyShell title="First rate plan" description="Onboarding step - demo can mark complete.">
      <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
        Complete this step in the live product with forms and uploads. For demo UI, mark done and continue.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
          onClick={() =>
            updateWorkspace((ws) => {
              if (!ws) return ws
              return {
                ...ws,
                onboardingDone: { ...ws.onboardingDone, rates: true },
              }
            })
          }
        >
          Mark done
        </button>
        <Link
          href="/agency/onboarding"
          className="inline-flex h-11 items-center rounded-[8px] border border-zinc-200 dark:border-zinc-700 px-4 text-sm font-semibold"
        >
          Back to checklist
        </Link>
      </div>
    </AgencyShell>
  )
}
