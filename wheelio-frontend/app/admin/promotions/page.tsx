"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminLinkButton,
  AdminPanel,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { cn } from "@/lib/utils"

export default function AdminPromotionsPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Promotions">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Promotions"
      description="Codes and featured uplifts. Redemptions are demo counters."
      actions={<AdminLinkButton href="/admin/promotions/new">New promo</AdminLinkButton>}
    >
      <AdminPanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className={cn("text-[11px] uppercase tracking-wide dark:border-zinc-700", adminMutedSoft)}>
                <th className="pb-2 pr-3 font-semibold">Code</th>
                <th className="pb-2 pr-3 font-semibold">Label</th>
                <th className="pb-2 pr-3 font-semibold">Type</th>
                <th className="pb-2 pr-3 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Redemptions</th>
              </tr>
            </thead>
            <tbody>
              {workspace.promotions.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/admin/promotions/${p.id}`}
                      className="font-mono font-semibold underline underline-offset-4"
                    >
                      {p.code}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3">{p.label}</td>
                  <td className={`py-2.5 pr-3 ${adminMuted}`}>{p.type}</td>
                  <td className="py-2.5 pr-3">
                    <AdminChip tone={p.status === "active" ? "strong" : "neutral"}>
                      {p.status}
                    </AdminChip>
                  </td>
                  <td className="py-2.5 font-mono tabular-nums">
                    {p.redemptions}/{p.maxRedemptions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
