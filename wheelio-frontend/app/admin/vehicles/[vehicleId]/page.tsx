"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit } from "@/lib/admin"

export default function AdminVehicleDetailPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const { workspace, session, ready, updateWorkspace } = useAdminSession()

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Vehicle">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const vehicle = workspace.vehicles.find((v) => v.id === vehicleId)

  if (!vehicle) {
    return (
      <AdminShell title="Vehicle not found">
        <AdminLinkButton href="/admin/vehicles" variant="secondary">
          Back to queue
        </AdminLinkButton>
      </AdminShell>
    )
  }

  const actorName = session.name
  const wasHidden = vehicle.forceHidden

  function toggleHide() {
    updateWorkspace((ws) => {
      if (!ws) return ws
      const nextHidden = !wasHidden
      return pushAudit(
        {
          ...ws,
          vehicles: ws.vehicles.map((v) =>
            v.id === vehicleId ? { ...v, forceHidden: nextHidden } : v,
          ),
        },
        actorName,
        nextHidden ? "Force hide vehicle" : "Restore vehicle visibility",
        `Vehicle ${vehicleId}`,
      )
    })
  }

  return (
    <AdminShell
      title={vehicle.plate}
      description={`${vehicle.makeModel} · ${vehicle.agencyName}`}
      actions={
        <>
          <AdminSecondaryButton type="button" onClick={toggleHide}>
            {vehicle.forceHidden ? "Unhide listing" : "Force hide"}
          </AdminSecondaryButton>
          <AdminLinkButton href={`/admin/agencies/${vehicle.agencyId}`} variant="secondary">
            Agency
          </AdminLinkButton>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Listing health">
          <AdminKeyValue
            rows={[
              { label: "Category", value: vehicle.category },
              { label: "Photo count", value: String(vehicle.photoCount) },
              {
                label: "Visibility",
                value: vehicle.forceHidden ? (
                  <AdminChip tone="strong">Force hidden</AdminChip>
                ) : (
                  <AdminChip>Live</AdminChip>
                ),
              },
            ]}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {vehicle.flags.map((f) => (
              <AdminChip key={f} tone="warn">
                {f}
              </AdminChip>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel title="Related bookings">
          <ul className="space-y-2 text-sm">
            {workspace.bookings
              .filter((b) => b.plate === vehicle.plate)
              .map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="font-medium underline underline-offset-4"
                  >
                    {b.reference}
                  </Link>
                  <span className={adminMuted}> · {b.status.replaceAll("_", " ")}</span>
                </li>
              ))}
            {workspace.bookings.filter((b) => b.plate === vehicle.plate).length === 0 ? (
              <li className={adminMuted}>No active demo bookings on this plate.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </div>
      <div className="mt-4">
        <AdminPrimaryButton type="button" disabled className="opacity-50">
          Request agency photo upload (demo)
        </AdminPrimaryButton>
      </div>
    </AdminShell>
  )
}
