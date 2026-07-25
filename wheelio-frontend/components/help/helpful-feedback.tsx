"use client"

import { useState } from "react"

export function HelpfulFeedback() {
  const [choice, setChoice] = useState<"yes" | "no" | null>(null)

  return (
    <div className="pt-8">
      <p className="text-sm font-medium">Was this helpful?</p>
      {choice ? (
        <p className="mt-3 text-sm text-black/55 dark:text-white/55">
          {choice === "yes"
            ? "Thanks — glad it helped."
            : "Thanks for the feedback. You can also reach support@wheelio.tn."}
        </p>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setChoice("yes")}
            className="rounded-[7px] border border-black/20 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setChoice("no")}
            className="rounded-[7px] border border-black/20 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
          >
            No
          </button>
        </div>
      )}
    </div>
  )
}
