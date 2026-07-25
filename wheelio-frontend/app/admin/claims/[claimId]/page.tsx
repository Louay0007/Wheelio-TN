"use client"

import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminAuditStrip,
  AdminChip,
  AdminField,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSelect,
  AdminTextarea,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { formatAdminTnd, pushAudit } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>()
  const { workspace, session, updateWorkspace, ready } = useAdminSession()
  const claim = useMemo(
    () => workspace?.claims.find((c) => c.id === claimId),
    [workspace, claimId],
  )
  const [decision, setDecision] = useState("uphold_customer")
  const [note, setNote] = useState("")

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Claim">
        <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!claim) {
    return (
      <AdminShell title="Not found">
        <AdminLinkButton href="/admin/claims" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  function decide() {
    updateWorkspace((ws) => {
      if (!ws) return ws
      let next = {
        ...ws,
        claims: ws.claims.map((c) =>
          c.id === claim!.id
            ? {
                ...c,
                status: "decided" as const,
                decision: `${decision}${note.trim() ? `: ${note.trim()}` : ""}`,
              }
            : c,
        ),
      }
      next = pushAudit(
        next,
        session!.name,
        `Claim decision ${decision}`,
        `Claim ${claim!.id} / ${claim!.bookingRef}`,
      )
      if (decision === "goodwill_refund" || decision === "uphold_customer") {
        next = {
          ...next,
          refunds: [
            {
              id: `rf-${Date.now()}`,
              bookingId: claim!.bookingId,
              bookingRef: claim!.bookingRef,
              status: "requested",
              customerAmountTnd: claim!.rentImpactTnd || 50,
              agencyClawbackTnd:
                decision === "uphold_customer" ? claim!.rentImpactTnd || 0 : 0,
              wheelioAbsorbsTnd: decision === "goodwill_refund" ? 50 : 0,
              reason: `Claim ${claim!.id}: ${decision}`,
              createdAt: new Date().toISOString(),
            },
            ...next.refunds,
          ],
        }
      }
      return next
    })
  }

  return (
    <AdminShell
      title={claim.type.replaceAll("_", " ")}
      description={claim.bookingRef}
      actions={<AdminChip tone="strong">{claim.status}</AdminChip>}
    >
      <div className="w-full max-w-2xl space-y-4">
        <AdminTip>
          Deposit {formatAdminTnd(claim.depositAtStakeTnd)} is tracked separately from trip
          refund math. Commission clawback creates a finance adjustment, not a silent rewrite.
        </AdminTip>

        <AdminPanel title="Case facts">
          <AdminKeyValue
            rows={[
              { label: "Source", value: claim.source },
              {
                label: "Booking",
                value: (
                  <AdminLinkButton href={`/admin/bookings/${claim.bookingId}`}>
                    {claim.bookingRef}
                  </AdminLinkButton>
                ),
              },
              {
                label: "Agency",
                value: (
                  <AdminLinkButton href={`/admin/agencies/${claim.agencyId}`}>
                    {claim.agencyName}
                  </AdminLinkButton>
                ),
              },
              {
                label: "Rent impact",
                value: formatAdminTnd(claim.rentImpactTnd),
              },
              {
                label: "Deposit at stake",
                value: formatAdminTnd(claim.depositAtStakeTnd),
              },
              {
                label: "Decision",
                value: claim.decision ?? "Pending",
              },
            ]}
          />
        </AdminPanel>

        <AdminPanel title="Evidence (stub)">
          <p className={cn("text-sm", adminMuted)}>
            Upload gallery is stubbed in demo. Link customer claim and agency issue attachments
            here in production.
          </p>
        </AdminPanel>

        {claim.status === "open" ? (
          <AdminPanel title="Decision">
            <AdminField label="Outcome">
              <AdminSelect
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                <option value="uphold_customer">Uphold customer</option>
                <option value="uphold_agency">Uphold agency</option>
                <option value="split">Split</option>
                <option value="goodwill_refund">Goodwill refund</option>
                <option value="escalate_legal">Escalate legal</option>
                <option value="close_no_action">Close no action</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Notes to both sides">
              <AdminTextarea value={note} onChange={(e) => setNote(e.target.value)} />
            </AdminField>
            <AdminPrimaryButton type="button" onClick={decide} className="mt-3">
              Record decision
            </AdminPrimaryButton>
          </AdminPanel>
        ) : null}

        <AdminAuditStrip
          entries={workspace.audit.filter(
            (a) => a.entity.includes(claim.id) || a.entity.includes(claim.bookingRef),
          )}
        />
      </div>
    </AdminShell>
  )
}
