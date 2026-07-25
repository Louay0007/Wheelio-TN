"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"
import { onboardingProgress } from "@/lib/agency"

export default function OnboardingReviewPage() {
  const { workspace, updateWorkspace } = useAgencySession()
  const progress = workspace ? onboardingProgress(workspace) : { percent: 0 }
  const ready = progress.percent === 100
  return (
    <AgencyShell title="Request activation" description="Wheelio reviews before go-live.">
      <p className="text-sm">Checklist {progress.percent}% complete.</p>
      <button
        type="button"
        disabled={!ready}
        className="mt-4 h-11 cursor-pointer rounded-[8px] bg-black px-4 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
        onClick={() =>
          updateWorkspace((ws) => {
            if (!ws) return ws
            return {
              ...ws,
              verification: "review",
              onboardingDone: { ...ws.onboardingDone, review: true },
            }
          })
        }
      >
        Request Wheelio activation
      </button>
      <Link href="/agency" className="ml-3 text-sm underline">Today board</Link>
    </AgencyShell>
  )
}
