"use client"

import { AgencyShell } from "@/components/agency/agency-shell"

const REVIEWS = [
  { name: "Amira", rating: 5, body: "Desk was ready at T1 - smooth pickup." },
  { name: "Nicolas", rating: 4, body: "Car clean. Deposit release took a day." },
]

export default function ReviewsPage() {
  return (
    <AgencyShell title="Reviews" description="Public customer reviews about this agency (read-only MVP).">
      <ul className="space-y-3">
        {REVIEWS.map((r) => (
          <li key={r.name} className="rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-4 text-sm">
            <p className="font-semibold">{r.name} · {r.rating}/5</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">{r.body}</p>
          </li>
        ))}
      </ul>
    </AgencyShell>
  )
}
