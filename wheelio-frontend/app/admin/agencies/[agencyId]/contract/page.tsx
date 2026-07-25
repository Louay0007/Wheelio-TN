"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminField,
  AdminPanel,
  AdminPrimaryButton,
  AdminSelect,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import {
  findAgency,
  pushAudit,
  type CommissionTier,
} from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminAgencyContractPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session, updateWorkspace } = useAdminSession()
  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )
  const [tier, setTier] = useState<CommissionTier>(agency?.commissionTier ?? "standard")
  const [saved, setSaved] = useState(false)

  if (!workspace || !agency || !session) {
    return (
      <AdminShell title="Contract">
        <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const rateFor = (t: CommissionTier) => {
    if (t === "launch") return workspace.takeRateLaunch
    if (t === "volume") return workspace.takeRateVolume
    return workspace.takeRateStandard
  }

  const ag = agency
  const actor = session.name

  function applyTier() {
    const pct = rateFor(tier) as 10 | 12
    updateWorkspace((ws) => {
      if (!ws) return ws
      let next: typeof ws = {
        ...ws,
        agencies: ws.agencies.map((a) =>
          a.id === ag.id ? { ...a, commissionTier: tier, takeRatePercent: pct } : a,
        ),
      }
      next = pushAudit(
        next,
        actor,
        `Commission tier → ${tier} (${pct}%)`,
        ag.tradeName,
      )
      return next
    })
    setSaved(true)
  }

  return (
    <AdminShell
      title="Contract and commission"
      description={agency.tradeName}
      actions={
        <Link href={`/admin/agencies/${agency.id}`} className="text-sm font-medium underline">
          Command center
        </Link>
      }
    >
      <div className="w-full space-y-4">
        <AdminPanel title="Partner Marketplace Agreement" hint="v2026.1 (demo PDF stub).">
          <p className={cn("text-sm", adminMuted)}>
            Signed agreement on file. Download countersigned PDF (demo).
          </p>
        </AdminPanel>

        <AdminPanel title="Commission tier">
          <AdminTip>
            Example: customer listed 95 TND at 12% → Wheelio fee ~11 TND, agency net ~84 TND.
            Deposit is never part of this math.
          </AdminTip>
          <div className="mt-4 space-y-3">
            <AdminField label="Tier for new bookings">
              <AdminSelect
                value={tier}
                onChange={(e) => {
                  setTier(e.target.value as CommissionTier)
                  setSaved(false)
                }}
                className="max-w-xs"
              >
                <option value="launch">Launch ({workspace.takeRateLaunch}%)</option>
                <option value="standard">Standard ({workspace.takeRateStandard}%)</option>
                <option value="volume">Volume ({workspace.takeRateVolume}%)</option>
              </AdminSelect>
            </AdminField>
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Warning: changing tier affects new bookings only. Confirmed trips keep their snapshot
              fee.
            </p>
            <AdminPrimaryButton type="button" onClick={applyTier}>
              Save tier
            </AdminPrimaryButton>
            {saved ? (
              <p className="text-sm" role="status">
                Tier updated to {tier} ({rateFor(tier)}%).
              </p>
            ) : null}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
