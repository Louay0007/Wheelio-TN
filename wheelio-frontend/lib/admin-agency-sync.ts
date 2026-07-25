/**
 * Sync Wheelio admin decisions into the agency demo workspace (same browser).
 */

import {
  AGENCY_STORAGE_KEY,
  createDemoAgencyWorkspace,
  type AgencyPayout,
  type AgencyVerification,
  type AgencyWorkspace,
  type CommissionTier,
} from "@/lib/agency"

function readAgencyWs(): AgencyWorkspace {
  try {
    const raw = localStorage.getItem(AGENCY_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AgencyWorkspace
  } catch {
    /* ignore */
  }
  return createDemoAgencyWorkspace()
}

function writeAgencyWs(ws: AgencyWorkspace) {
  localStorage.setItem(AGENCY_STORAGE_KEY, JSON.stringify(ws))
  window.dispatchEvent(new Event("wheelio-agency-workspace"))
}

function patchDemoAgency(
  patch: (ws: AgencyWorkspace) => AgencyWorkspace,
  agencyId = "agency-demo-1",
) {
  if (typeof window === "undefined") return
  const ws = readAgencyWs()
  // Demo agency portal is single-tenant Carthage Drive; only sync when targeting it
  // or when slug/id matches.
  if (ws.id !== agencyId && agencyId !== "agency-demo-1" && ws.id !== "agency-demo-1") {
    // Still allow patch when admin agency id matches stored id
    if (ws.id !== agencyId) return
  }
  const next = patch({ ...ws })
  writeAgencyWs(next)
}

export function syncAgencyVerification(opts: {
  agencyId: string
  verification: AgencyVerification
  publicVisible?: boolean
}) {
  patchDemoAgency((ws) => {
    if (opts.agencyId !== "agency-demo-1" && ws.id !== opts.agencyId) return ws
    return {
      ...ws,
      verification: opts.verification,
      ...(opts.publicVisible === false
        ? { bookingMode: "request" as const }
        : {}),
    }
  }, opts.agencyId)
}

export function syncAgencyInstant(opts: {
  agencyId: string
  instantEnabled: boolean
}) {
  patchDemoAgency((ws) => {
    if (opts.agencyId !== "agency-demo-1" && ws.id !== opts.agencyId) return ws
    return {
      ...ws,
      bookingMode: opts.instantEnabled ? "instant" : "request",
    }
  }, opts.agencyId)
}

export function syncAgencyTier(opts: {
  agencyId: string
  tier: CommissionTier
  takeRatePercent: 10 | 12
}) {
  patchDemoAgency((ws) => {
    if (opts.agencyId !== "agency-demo-1" && ws.id !== opts.agencyId) return ws
    return {
      ...ws,
      commissionTier: opts.tier,
      takeRatePercent: opts.takeRatePercent,
    }
  }, opts.agencyId)
}

export function syncAgencyPayoutFromAdmin(opts: {
  agencyId: string
  payout: {
    id: string
    periodLabel: string
    netPayableTnd: number
    commissionTnd: number
    listedTotalTnd: number
    status: AgencyPayout["status"] | string
    ibanLast4: string
    bookingIds: string[]
  }
}) {
  patchDemoAgency((ws) => {
    if (opts.agencyId !== "agency-demo-1" && ws.id !== opts.agencyId) return ws
    const statusMap: Record<string, AgencyPayout["status"]> = {
      draft: "scheduled",
      pending_approval: "scheduled",
      scheduled: "scheduled",
      paid: "paid",
      held: "on_hold",
      failed: "scheduled",
    }
    const row: AgencyPayout = {
      id: opts.payout.id,
      periodLabel: opts.payout.periodLabel,
      gmvTnd: opts.payout.listedTotalTnd,
      commissionTnd: opts.payout.commissionTnd,
      netPayableTnd: opts.payout.netPayableTnd,
      status:
        opts.payout.status === "held"
          ? "on_hold"
          : opts.payout.status === "paid"
            ? "paid"
            : statusMap[opts.payout.status] ?? "scheduled",
      bankLast4: opts.payout.ibanLast4,
      bookingIds: opts.payout.bookingIds,
    }
    const others = ws.payouts.filter((p) => p.id !== row.id)
    return { ...ws, payouts: [row, ...others] }
  }, opts.agencyId)
}
