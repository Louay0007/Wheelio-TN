"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyLinkButton,
  AgencyPanel,
  AgencyTip,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import { formatAgencyTnd } from "@/lib/agency"
import { cn } from "@/lib/utils"

export default function PayoutsPage() {
  const { workspace, ready, session } = useAgencySession()
  const canSee =
    !session ||
    session.role === "owner" ||
    session.role === "manager" ||
    session.role === "accountant"

  return (
    <AgencyShell
      title="Payments to you"
      description="What Wheelio will send to your bank after the fee is taken."
      actions={
        <>
          <AgencyLinkButton href="/agency/ledger" variant="secondary">
            Money log
          </AgencyLinkButton>
          <AgencyLinkButton href="/agency/invoices" variant="secondary">
            Invoices
          </AgencyLinkButton>
        </>
      }
    >
      {!ready || !workspace ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      ) : !canSee ? (
        <AgencyPanel title="No access">
          <p className={cn("text-sm", agencyMuted)}>
            Only owners, managers, and accountants can see payments. Ask your owner
            if you need access.
          </p>
        </AgencyPanel>
      ) : (
        <div className="w-full space-y-4">
          <AgencyTip>
            Numbers below exclude deposits. Deposit cash stays at your desk and is
            never part of the Wheelio fee.
          </AgencyTip>
          <ul className="space-y-3">
            {workspace.payouts.map((p) => (
              <li key={p.id}>
                <Link href={`/agency/payouts/${p.id}`} className="block">
                  <AgencyPanel>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{p.periodLabel}</p>
                      <span className="rounded-[6px] border border-zinc-300 px-2 py-0.5 text-[11px] font-semibold uppercase dark:border-zinc-600">
                        {p.status === "paid"
                          ? "Paid"
                          : p.status === "on_hold"
                            ? "On hold"
                            : "Scheduled"}
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-sm tabular-nums text-zinc-800 dark:text-zinc-100">
                      Sales {formatAgencyTnd(p.gmvTnd)} · Fee{" "}
                      {formatAgencyTnd(p.commissionTnd)} · You get{" "}
                      <span className="font-semibold">
                        {formatAgencyTnd(p.netPayableTnd)}
                      </span>
                    </p>
                    <p className={cn("mt-1 text-xs", agencyMuted)}>
                      Bank ···{p.bankLast4}
                      {p.bookingIds.length
                        ? ` · ${p.bookingIds.length} booking(s)`
                        : ""}
                    </p>
                  </AgencyPanel>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AgencyShell>
  )
}
