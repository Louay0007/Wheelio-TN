/**
 * Dual-control requests for sensitive admin writes (demo).
 */

import type {
  AdminBookingStatus,
  AdminWorkspace,
  AgencyVerification,
  CommissionTier,
} from "@/lib/admin"
import { pushAudit } from "@/lib/admin"
import {
  syncAgencyPayoutFromAdmin,
  syncAgencyTier,
  syncAgencyVerification,
} from "@/lib/admin-agency-sync"

export type DualControlKind =
  | "payout_release"
  | "tier_change"
  | "agency_suspend"
  | "force_cancel"

export type DualControlRequest = {
  id: string
  kind: DualControlKind
  entity: string
  summary: string
  payload: Record<string, string | number | boolean>
  requestedBy: string
  requestedByStaffId: string
  requestedAt: string
  status: "pending" | "approved" | "rejected"
  approvedBy?: string
  decidedAt?: string
}

export function ensureDualControl(
  ws: AdminWorkspace,
): AdminWorkspace & { dualControl: DualControlRequest[] } {
  const any = ws as AdminWorkspace & { dualControl?: DualControlRequest[] }
  if (Array.isArray(any.dualControl))
    return any as AdminWorkspace & { dualControl: DualControlRequest[] }
  return { ...ws, dualControl: [] }
}

export function addDualControlRequest(
  ws: AdminWorkspace,
  req: Omit<DualControlRequest, "id" | "requestedAt" | "status">,
): AdminWorkspace {
  const base = ensureDualControl(ws)
  const row: DualControlRequest = {
    ...req,
    id: `dc-${Date.now()}`,
    requestedAt: new Date().toISOString(),
    status: "pending",
  }
  return { ...base, dualControl: [row, ...base.dualControl] }
}

export function decideDualControl(
  ws: AdminWorkspace,
  id: string,
  decision: "approved" | "rejected",
  actor: string,
): AdminWorkspace {
  const base = ensureDualControl(ws)
  return {
    ...base,
    dualControl: base.dualControl.map((r) =>
      r.id === id
        ? {
            ...r,
            status: decision,
            approvedBy: actor,
            decidedAt: new Date().toISOString(),
          }
        : r,
    ),
  }
}

export function pendingDualForEntity(ws: AdminWorkspace, entity: string) {
  const base = ensureDualControl(ws)
  return base.dualControl.find(
    (r) => r.status === "pending" && r.entity === entity,
  )
}

/** Apply workspace mutations once a dual-control request is approved. */
export function applyDualControlPayload(
  ws: AdminWorkspace,
  req: DualControlRequest,
): AdminWorkspace {
  const p = req.payload
  switch (req.kind) {
    case "payout_release": {
      const payoutId = String(p.payoutId ?? "")
      const next = {
        ...ws,
        payoutBatches: ws.payoutBatches.map((b) =>
          b.id === payoutId
            ? {
                ...b,
                status: "scheduled" as const,
                holdReason: undefined,
              }
            : b,
        ),
      }
      const batch = next.payoutBatches.find((b) => b.id === payoutId)
      if (batch) {
        syncAgencyPayoutFromAdmin({
          agencyId: batch.agencyId,
          payout: {
            id: batch.id,
            periodLabel: batch.periodLabel,
            netPayableTnd: batch.netPayableTnd,
            commissionTnd: batch.commissionTnd,
            listedTotalTnd: batch.listedTotalTnd,
            status: batch.status,
            ibanLast4: batch.ibanLast4,
            bookingIds: batch.bookingIds,
          },
        })
      }
      return next
    }
    case "tier_change": {
      const agencyId = String(p.agencyId ?? "")
      const tier = String(p.tier) as CommissionTier
      const take = Number(p.takeRatePercent) as 10 | 12
      const next = {
        ...ws,
        agencies: ws.agencies.map((a) =>
          a.id === agencyId
            ? { ...a, commissionTier: tier, takeRatePercent: take }
            : a,
        ),
      }
      syncAgencyTier({ agencyId, tier, takeRatePercent: take })
      return next
    }
    case "agency_suspend": {
      const agencyId = String(p.agencyId ?? "")
      const verification = String(p.verification ?? "suspended") as AgencyVerification
      const next = {
        ...ws,
        agencies: ws.agencies.map((a) =>
          a.id === agencyId
            ? {
                ...a,
                verification,
                publicVisible: verification === "live",
                instantEnabled: verification === "live" ? a.instantEnabled : false,
              }
            : a,
        ),
      }
      syncAgencyVerification({
        agencyId,
        verification:
          verification === "live"
            ? "live"
            : verification === "paused"
              ? "paused"
              : "suspended",
        publicVisible: verification === "live",
      })
      return next
    }
    case "force_cancel": {
      const bookingId = String(p.bookingId ?? "")
      const nextStatus = String(p.nextStatus ?? "cancelled") as AdminBookingStatus
      const reason = String(p.reason ?? "Dual-control force cancel")
      const refundDraft = Boolean(p.refundDraft)
      const booking = ws.bookings.find((b) => b.id === bookingId)
      let next: AdminWorkspace = {
        ...ws,
        bookings: ws.bookings.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: nextStatus,
                timeline: [
                  {
                    label: `Admin override → ${nextStatus} (${reason})`,
                    at: new Date().toISOString(),
                    source: "admin" as const,
                  },
                  ...b.timeline,
                ],
              }
            : b,
        ),
      }
      if (refundDraft && booking) {
        next = {
          ...next,
          refunds: [
            {
              id: `rf-${Date.now()}`,
              bookingId,
              bookingRef: booking.reference,
              status: "requested",
              customerAmountTnd: booking.listedTotalTnd,
              agencyClawbackTnd: 0,
              wheelioAbsorbsTnd: 0,
              reason: `Override cancel: ${reason}`,
              createdAt: new Date().toISOString(),
            },
            ...next.refunds,
          ],
        }
      }
      return next
    }
    default:
      return ws
  }
}

export function approveDualControl(
  ws: AdminWorkspace,
  id: string,
  actor: string,
): AdminWorkspace {
  const base = ensureDualControl(ws)
  const req = base.dualControl.find((r) => r.id === id)
  if (!req || req.status !== "pending") return ws
  let next = decideDualControl(ws, id, "approved", actor)
  next = applyDualControlPayload(next, req)
  return pushAudit(
    next,
    actor,
    `Dual-control approved: ${req.summary}`,
    req.entity,
  )
}

export function rejectDualControl(
  ws: AdminWorkspace,
  id: string,
  actor: string,
): AdminWorkspace {
  const base = ensureDualControl(ws)
  const req = base.dualControl.find((r) => r.id === id)
  if (!req || req.status !== "pending") return ws
  return pushAudit(
    decideDualControl(ws, id, "rejected", actor),
    actor,
    `Dual-control rejected: ${req.summary}`,
    req.entity,
  )
}
