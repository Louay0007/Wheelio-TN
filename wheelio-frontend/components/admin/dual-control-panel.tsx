"use client"

import {
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import {
  approveDualControl,
  ensureDualControl,
  rejectDualControl,
  type DualControlRequest,
} from "@/lib/admin-dual-control"
import { useAdminSession } from "@/lib/admin-session"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

export function DualControlPendingBanner({
  pending,
  onSettled,
}: {
  pending: DualControlRequest | undefined
  onSettled?: (decision: "approved" | "rejected", req: DualControlRequest) => void
}) {
  const { session, updateWorkspace } = useAdminSession()
  const { t } = useLocale()

  if (!pending || !session) return null

  const sameActor = pending.requestedByStaffId === session.staffId
  const canDecide = !sameActor

  function decide(decision: "approved" | "rejected") {
    if (!canDecide || !pending) return
    const req = pending
    updateWorkspace((ws) => {
      if (!ws) return ws
      return decision === "approved"
        ? approveDualControl(ws, req.id, session!.name)
        : rejectDualControl(ws, req.id, session!.name)
    })
    onSettled?.(decision, req)
  }

  return (
    <AdminPanel
      title={t("admin.dualPending")}
      hint={`${pending.kind.replaceAll("_", " ")} · requested by ${pending.requestedBy}`}
      className="border-amber-400/80 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-950/40"
    >
      <p className="text-sm text-zinc-900 dark:text-zinc-50">{pending.summary}</p>
      <p className={cn("mt-1 text-xs", adminMuted)}>
        Submitted {new Date(pending.requestedAt).toLocaleString()}
      </p>
      {sameActor ? (
        <AdminTip className="mt-3">
          Second signer must be a different staff account. Sign in as finance@ or
          admin@ (not the requester) to approve.
        </AdminTip>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminPrimaryButton type="button" onClick={() => decide("approved")}>
            {t("admin.dualApprove")}
          </AdminPrimaryButton>
          <AdminSecondaryButton type="button" onClick={() => decide("rejected")}>
            {t("admin.dualReject")}
          </AdminSecondaryButton>
        </div>
      )}
    </AdminPanel>
  )
}

export function DualControlQueue() {
  const { workspace, session, updateWorkspace } = useAdminSession()
  const { t } = useLocale()
  if (!workspace || !session) return null
  const pending = ensureDualControl(workspace).dualControl.filter(
    (r) => r.status === "pending",
  )
  if (pending.length === 0) return null

  return (
    <AdminPanel title={t("admin.dualPending")} hint={`${pending.length} open`}>
      <ul className="space-y-3 text-sm">
        {pending.map((r) => {
          const same = r.requestedByStaffId === session.staffId
          return (
            <li
              key={r.id}
              className="rounded-[8px] border border-zinc-200 p-3 dark:border-zinc-700"
            >
              <p className="font-medium">{r.summary}</p>
              <p className={cn("mt-0.5 text-xs", adminMuted)}>
                {r.kind} · {r.requestedBy} · {r.entity}
              </p>
              {!same ? (
                <div className="mt-2 flex gap-2">
                  <AdminPrimaryButton
                    type="button"
                    className="h-9 text-xs"
                    onClick={() => {
                      updateWorkspace((ws) =>
                        ws ? approveDualControl(ws, r.id, session.name) : ws,
                      )
                    }}
                  >
                    {t("admin.dualApprove")}
                  </AdminPrimaryButton>
                  <AdminSecondaryButton
                    type="button"
                    className="h-9 text-xs"
                    onClick={() => {
                      updateWorkspace((ws) =>
                        ws ? rejectDualControl(ws, r.id, session.name) : ws,
                      )
                    }}
                  >
                    {t("admin.dualReject")}
                  </AdminSecondaryButton>
                </div>
              ) : (
                <p className={cn("mt-2 text-xs", adminMuted)}>
                  Waiting on another staff member.
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </AdminPanel>
  )
}
