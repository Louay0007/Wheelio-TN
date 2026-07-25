"use client"

import Link from "next/link"
import { DualControlQueue } from "@/components/admin/dual-control-panel"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminLinkButton,
  AdminPanel,
  AdminStat,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import {
  formatAdminTnd,
  queueCounts,
  roleCanManagePartners,
  roleCanSupport,
  roleCanWriteFinance,
} from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminHomePage() {
  const { workspace, session, ready } = useAdminSession()

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Home" requireAuth={false}>
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const q = queueCounts(workspace)
  const role = session.role
  const commission7d = Math.round(
    workspace.bookings
      .filter((b) => ["completed", "active", "confirmed"].includes(b.status))
      .reduce((s, b) => s + b.commissionTnd, 0) * 0.35,
  )
  const gmv7d = Math.round(
    workspace.bookings.reduce((s, b) => s + b.listedTotalTnd, 0) * 0.4,
  )

  return (
    <AdminShell
      title={`Hi ${session.name.split(" ")[0]}`}
      description="What needs a Wheelio human in the next few hours."
      actions={
        <>
          <AdminLinkButton href="/admin/search" variant="secondary">
            Search
          </AdminLinkButton>
          {roleCanSupport(role) ? (
            <AdminLinkButton href="/admin/cases/new">New case</AdminLinkButton>
          ) : null}
        </>
      }
    >
      <div className="w-full space-y-4">
        <DualControlQueue />
        <AdminTip>
          Queue-first board. Fee context: standard {workspace.takeRateStandard}% of customer
          trip total. Deposit never counts toward GMV.
        </AdminTip>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <AdminStat
            label="Applications"
            value={String(q.applications)}
            hint="Need review"
            href="/admin/applications"
          />
          <AdminStat
            label="Cases"
            value={String(q.cases)}
            hint="Open / waiting"
            href="/admin/cases"
          />
          <AdminStat
            label="Claims"
            value={String(q.claims)}
            hint="Undecided"
            href="/admin/claims"
          />
          <AdminStat
            label="SLA risk"
            value={String(q.sla)}
            hint="< 2h left"
            href="/admin/sla"
          />
          <AdminStat
            label="Payouts"
            value={String(q.payouts)}
            hint="Need action"
            href="/admin/finance/payouts"
          />
          <AdminStat
            label="Reviews flagged"
            value={String(q.reviews)}
            hint="Moderate"
            href="/admin/content/reviews"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <AdminPanel title="Money pulse (demo)">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className={adminMuted}>GMV 7d (excl. deposit)</dt>
                <dd className="font-mono font-semibold">{formatAdminTnd(gmv7d)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className={adminMuted}>Commission accrued</dt>
                <dd className="font-mono font-semibold">
                  {formatAdminTnd(commission7d)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className={adminMuted}>Take rate</dt>
                <dd className="font-semibold">{workspace.takeRateStandard}%</dd>
              </div>
            </dl>
            {roleCanWriteFinance(role) ? (
              <div className="mt-3">
                <AdminLinkButton href="/admin/finance" variant="secondary">
                  Open finance
                </AdminLinkButton>
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Today risk">
            <ul className="space-y-2 text-sm">
              {workspace.bookings
                .filter((b) =>
                  ["held", "payment_pending", "requested"].includes(b.status),
                )
                .slice(0, 4)
                .map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {b.reference}
                    </Link>
                    <span className={cn("ml-2", adminMuted)}>
                      {b.status.replaceAll("_", " ")} · {b.agencyName}
                    </span>
                  </li>
                ))}
            </ul>
          </AdminPanel>

          <AdminPanel title="Supply pulse">
            <ul className="space-y-2 text-sm">
              <li>
                Live agencies:{" "}
                <strong>
                  {workspace.agencies.filter((a) => a.verification === "live").length}
                </strong>
              </li>
              <li>
                Vehicles flagged: <strong>{workspace.vehicles.length}</strong>
              </li>
              <li>
                Locations draft:{" "}
                <strong>
                  {workspace.locations.filter((l) => l.status === "draft").length}
                </strong>
              </li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {roleCanManagePartners(role) ? (
                <AdminLinkButton href="/admin/applications" variant="secondary">
                  Review joins
                </AdminLinkButton>
              ) : null}
              <AdminLinkButton href="/admin/vehicles" variant="secondary">
                Vehicle QA
              </AdminLinkButton>
            </div>
          </AdminPanel>
        </div>

        <AdminPanel title="Shortcuts">
          <div className="flex flex-wrap gap-2">
            <AdminLinkButton href="/admin/finance/payouts/new" variant="secondary">
              Create payout batch
            </AdminLinkButton>
            <AdminLinkButton href="/admin/content/reviews" variant="secondary">
              Moderate reviews
            </AdminLinkButton>
            <AdminLinkButton href="/admin/agencies" variant="secondary">
              All agencies
            </AdminLinkButton>
            <AdminLinkButton href="/admin/analytics" variant="secondary">
              Analytics
            </AdminLinkButton>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
