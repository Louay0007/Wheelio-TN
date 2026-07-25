"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminField,
  AdminLinkButton,
  AdminPanel,
  AdminSecondaryButton,
  AdminTextarea,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findAgency, pushAudit } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminAgencyFleetPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session, updateWorkspace } = useAdminSession()
  const [hideReason, setHideReason] = useState("")
  const [pendingHideId, setPendingHideId] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )

  const vehicles = useMemo(
    () => workspace?.vehicles.filter((v) => v.agencyId === agency?.id) ?? [],
    [workspace, agency],
  )

  if (!workspace || !session) {
    return (
      <AdminShell title="Fleet">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!agency) {
    return (
      <AdminShell title="Fleet">
        <p className="text-sm">Agency not found.</p>
      </AdminShell>
    )
  }

  const ag = agency
  const actor = session.name

  function toggleForceHide(vehicleId: string) {
    const vehicle = workspace!.vehicles.find((v) => v.id === vehicleId)
    if (!vehicle) return
    const nextHidden = !vehicle.forceHidden
    if (nextHidden && !hideReason.trim()) {
      setFlash("Add a reason before force-hiding a listing.")
      return
    }
    updateWorkspace((ws) => {
      if (!ws) return ws
      let updated: typeof ws = {
        ...ws,
        vehicles: ws.vehicles.map((v) =>
          v.id === vehicleId ? { ...v, forceHidden: nextHidden } : v,
        ),
      }
      updated = pushAudit(
        updated,
        actor,
        nextHidden
          ? `Force hide vehicle ${vehicle.plate} (${hideReason.trim()})`
          : `Restore vehicle visibility ${vehicle.plate}`,
        ag.tradeName,
      )
      return updated
    })
    setPendingHideId(null)
    setHideReason("")
    setFlash(
      nextHidden
        ? `${vehicle.plate} hidden from search.`
        : `${vehicle.plate} visible again.`,
    )
  }

  return (
    <AdminShell
      title="Fleet"
      description={`${agency.tradeName} · ${agency.vehicleCount} vehicles on file`}
      actions={
        <Link href={`/admin/agencies/${agency.id}`} className="text-sm font-medium underline">
          Command center
        </Link>
      }
    >
      <div className="w-full space-y-4">
        {flash ? (
          <p className="text-sm text-zinc-800 dark:text-zinc-100" role="status">
            {flash}
          </p>
        ) : null}

        <AdminPanel title="Vehicles">
          {vehicles.length === 0 ? (
            <p className={cn("text-sm", adminMuted)}>
              No moderated rows yet. Count on agency record: {agency.vehicleCount}.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {vehicles.map((v) => (
                <li
                  key={v.id}
                  className="rounded-[8px] border border-zinc-200 px-3 py-3 dark:border-zinc-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <Link
                        href={`/admin/vehicles/${v.id}`}
                        className="font-mono font-semibold underline underline-offset-4"
                      >
                        {v.plate}
                      </Link>{" "}
                      · {v.makeModel}
                    </span>
                    {v.forceHidden ? <AdminChip tone="warn">Force hidden</AdminChip> : null}
                  </div>
                  <p className={cn("mt-1 text-xs", adminMutedSoft)}>
                    {v.category} · {v.photoCount} photos
                    {v.flags.length ? ` · ${v.flags.join(", ")}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <AdminLinkButton href={`/admin/vehicles/${v.id}`} variant="secondary">
                      Open detail
                    </AdminLinkButton>
                    <AdminSecondaryButton
                      type="button"
                      onClick={() => {
                        if (v.forceHidden) {
                          toggleForceHide(v.id)
                        } else {
                          setPendingHideId(v.id)
                        }
                      }}
                    >
                      {v.forceHidden ? "Unhide listing" : "Force hide"}
                    </AdminSecondaryButton>
                  </div>
                  {pendingHideId === v.id ? (
                    <div className="mt-3 rounded-[7px] border border-zinc-300 p-3 dark:border-zinc-600">
                      <AdminField label="Reason">
                        <AdminTextarea
                          value={hideReason}
                          onChange={(e) => setHideReason(e.target.value)}
                          placeholder="Policy or quality reason for hiding…"
                          rows={3}
                        />
                      </AdminField>
                      <div className="mt-2 flex gap-2">
                        <AdminSecondaryButton type="button" onClick={() => toggleForceHide(v.id)}>
                          Confirm hide
                        </AdminSecondaryButton>
                        <AdminSecondaryButton
                          type="button"
                          onClick={() => {
                            setPendingHideId(null)
                            setHideReason("")
                          }}
                        >
                          Cancel
                        </AdminSecondaryButton>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
