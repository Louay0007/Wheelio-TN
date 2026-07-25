"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyPanel,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { cn } from "@/lib/utils"

const ARTICLES = [
  ["accepting-requests", "Accepting requests and reply timers"],
  ["double-booking", "Avoiding double bookings"],
  ["nets-vs-listed", "Your net vs the customer price"],
  ["deposits", "Deposits at the desk"],
  ["handover", "Giving the car (handover)"],
  ["rankings", "Rankings and Instant unlock"],
  ["payouts", "Payments and fees"],
] as const

export default function AgencyHelpPage() {
  return (
    <AgencyShell
      title="Help"
      description="Short guides for daily desk work. Email partners@wheelio.tn during desk hours."
    >
      <div className="w-full max-w-2xl space-y-4">
        <AgencyTip>
          Prefer plain steps over theory. If something is blocked in demo, say so in
          the ticket.
        </AgencyTip>
        <ul className="space-y-2">
          {ARTICLES.map(([slug, title]) => (
            <li key={slug}>
              <Link
                href={`/agency/help/${slug}`}
                className="block rounded-[12px] border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-950 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-500"
              >
                {title}
              </Link>
            </li>
          ))}
        </ul>
        <AgencyPanel title="Still stuck?">
          <a
            href="mailto:partners@wheelio.tn"
            className="font-medium underline underline-offset-4"
          >
            partners@wheelio.tn
          </a>
          <p className={cn("mt-2 text-sm", agencyMuted)}>
            Include your agency name and booking code when you write.
          </p>
        </AgencyPanel>
      </div>
    </AgencyShell>
  )
}
