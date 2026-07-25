"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminLinkButton,
  AdminPanel,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { cn } from "@/lib/utils"

export default function AdminLocationsPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Locations">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Pickup locations"
      description="SEO and desk tips shown on customer location pages."
      actions={
        <AdminLinkButton href="/admin/locations/new">New location</AdminLinkButton>
      }
    >
      <AdminPanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className={cn("text-[11px] uppercase tracking-wide dark:border-zinc-700", adminMutedSoft)}>
                <th className="pb-2 pr-3 font-semibold">Name</th>
                <th className="pb-2 pr-3 font-semibold">City</th>
                <th className="pb-2 pr-3 font-semibold">Status</th>
                <th className="pb-2 pr-3 font-semibold">Agencies</th>
                <th className="pb-2 font-semibold">Slug</th>
              </tr>
            </thead>
            <tbody>
              {workspace.locations.map((loc) => (
                <tr
                  key={loc.slug}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/admin/locations/${loc.slug}`}
                      className="font-semibold underline underline-offset-4"
                    >
                      {loc.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3">{loc.city}</td>
                  <td className="py-2.5 pr-3">
                    <AdminChip tone={loc.status === "published" ? "strong" : "neutral"}>
                      {loc.status}
                    </AdminChip>
                  </td>
                  <td className="py-2.5 pr-3 font-mono tabular-nums">
                    {loc.linkedAgencies}
                  </td>
                  <td className="py-2.5 font-mono text-xs">{loc.slug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
