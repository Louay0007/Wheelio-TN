"use client"

import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { DualControlPendingBanner } from "@/components/admin/dual-control-panel"
import { AdminBookingSubnav } from "@/components/admin/admin-booking-subnav"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminField,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSelect,
  AdminTextarea,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import {
  addDualControlRequest,
  pendingDualForEntity,
} from "@/lib/admin-dual-control"
import { useAdminSession } from "@/lib/admin-session"
import {
  bookingStatusLabel,
  findBooking,
  pushAudit,
  roleCanSupport,
  type AdminBookingStatus,
} from "@/lib/admin"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

const ALLOWED: Partial<Record<AdminBookingStatus, AdminBookingStatus[]>> = {
  requested: ["confirmed", "cancelled", "expired", "rejected"],
  held: ["confirmed", "cancelled", "payment_pending"],
  payment_pending: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled", "no_show"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  expired: [],
  rejected: [],
  no_show: [],
}

export default function AdminBookingOverridePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { workspace, session, ready, updateWorkspace } = useAdminSession()
  const { t } = useLocale()
  const booking = useMemo(
    () => (workspace ? findBooking(workspace, id) : undefined),
    [workspace, id],
  )
  const [nextStatus, setNextStatus] = useState<AdminBookingStatus | "">("")
  const [reason, setReason] = useState("")
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [notifyAgency, setNotifyAgency] = useState(true)
  const [releaseCar, setReleaseCar] = useState(false)
  const [refundDraft, setRefundDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Override">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!booking) {
    return (
      <AdminShell title="Not found">
        <AdminLinkButton href="/admin/bookings" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  if (!roleCanSupport(session.role)) {
    return (
      <AdminShell title="No access">
        <AdminTip>
          Status override is limited to support and super. Ask a super-admin if you need
          this change.
        </AdminTip>
        <AdminLinkButton href={`/admin/bookings/${booking.id}`} variant="secondary">
          Back to booking
        </AdminLinkButton>
      </AdminShell>
    )
  }

  const options = ALLOWED[booking.status] ?? []
  const bookingId = booking.id
  const bookingRef = booking.reference
  const bookingStatus = booking.status
  const pending = pendingDualForEntity(workspace, `force-cancel:${bookingId}`)
  const forceCancel = nextStatus === "cancelled"

  function apply() {
    if (!nextStatus) {
      setError("Choose a target status.")
      return
    }
    if (!options.includes(nextStatus)) {
      setError("That transition is blocked.")
      return
    }
    if (!reason.trim()) {
      setError("Reason is required for every override.")
      return
    }

    if (forceCancel) {
      if (pending) {
        setError("Force-cancel already waiting on a second approver.")
        return
      }
      updateWorkspace((ws) => {
        if (!ws) return ws
        return pushAudit(
          addDualControlRequest(ws, {
            kind: "force_cancel",
            entity: `force-cancel:${bookingId}`,
            summary: `Force-cancel ${bookingRef} → cancelled`,
            payload: {
              bookingId,
              nextStatus: "cancelled",
              reason: reason.trim(),
              refundDraft,
              notifyCustomer,
              notifyAgency,
              releaseCar,
            },
            requestedBy: session!.name,
            requestedByStaffId: session!.staffId,
          }),
          session!.name,
          `Force-cancel submitted for dual-control`,
          `Booking ${bookingRef}`,
        )
      })
      setFlash(t("dual.requestBody"))
      setError(null)
      return
    }

    updateWorkspace((ws) => {
      if (!ws) return ws
      let next = {
        ...ws,
        bookings: ws.bookings.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: nextStatus as AdminBookingStatus,
                timeline: [
                  {
                    label: `Admin override → ${nextStatus} (${reason.trim()})`,
                    at: new Date().toISOString(),
                    source: "admin" as const,
                  },
                  ...b.timeline,
                ],
              }
            : b,
        ),
      }
      next = pushAudit(
        next,
        session!.name,
        `Override ${bookingStatus} → ${nextStatus}: ${reason.trim()}`,
        `Booking ${bookingRef}`,
      )
      if (refundDraft) {
        next = {
          ...next,
          refunds: [
            {
              id: `rf-${Date.now()}`,
              bookingId,
              bookingRef,
              status: "requested",
              customerAmountTnd: booking!.listedTotalTnd,
              agencyClawbackTnd: 0,
              wheelioAbsorbsTnd: 0,
              reason: `Override cancel: ${reason.trim()}`,
              createdAt: new Date().toISOString(),
            },
            ...next.refunds,
          ],
        }
      }
      return next
    })
    router.push(`/admin/bookings/${bookingId}`)
  }

  return (
    <AdminShell
      title={`Override ${booking.reference}`}
      description="Maximum friction. Side effects shown before confirm."
    >
      <div className="w-full max-w-2xl space-y-4">
        <AdminBookingSubnav bookingId={booking.id} active="override" />

        <AdminTip>
          Current status: {bookingStatusLabel(booking.status)}. Force-cancel always needs
          dual-control. Other transitions apply immediately for support roles.
        </AdminTip>

        {flash ? (
          <p className="text-sm" role="status">
            {flash}
          </p>
        ) : null}

        <DualControlPendingBanner
          pending={pending}
          onSettled={(decision) => {
            if (decision === "approved") router.push(`/admin/bookings/${bookingId}`)
          }}
        />

        {options.length === 0 ? (
          <AdminPanel title="Blocked">
            <p className={cn("text-sm", adminMuted)}>
              No further status overrides from {bookingStatusLabel(booking.status)}.
            </p>
          </AdminPanel>
        ) : (
          <AdminPanel title="Proposed change">
            <AdminField label="New status">
              <AdminSelect
                value={nextStatus}
                onChange={(e) =>
                  setNextStatus(e.target.value as AdminBookingStatus | "")
                }
              >
                <option value="">Select…</option>
                {options.map((s) => (
                  <option key={s} value={s}>
                    {bookingStatusLabel(s)}
                    {s === "cancelled" ? " (dual-control)" : ""}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Reason (required)">
              <AdminTextarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </AdminField>
            <fieldset className="mt-3 space-y-2 text-sm">
              <legend className="font-semibold">Side effects</legend>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                />
                Notify customer
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifyAgency}
                  onChange={(e) => setNotifyAgency(e.target.checked)}
                />
                Notify agency
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={releaseCar}
                  onChange={(e) => setReleaseCar(e.target.checked)}
                />
                Release inventory
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={refundDraft}
                  onChange={(e) => setRefundDraft(e.target.checked)}
                />
                Start refund draft (finance queue)
              </label>
            </fieldset>
            {error ? (
              <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-4">
              <AdminPrimaryButton
                type="button"
                onClick={apply}
                disabled={Boolean(pending && forceCancel)}
              >
                {forceCancel ? t("dual.submit") : "Confirm override"}
              </AdminPrimaryButton>
            </div>
          </AdminPanel>
        )}
      </div>
    </AdminShell>
  )
}
