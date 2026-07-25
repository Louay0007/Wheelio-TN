"use client"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminPanel,
  AdminTip,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"

export default function AdminCategoriesPage() {
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Categories">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Vehicle categories"
      description="Marketplace taxonomy. Agencies map fleet labels to these ids at onboarding."
    >
      <AdminTip>
        Deposit and fee rules attach at category level in production. Demo shows read-only
        taxonomy from workspace seed.
      </AdminTip>
      <AdminPanel title="Canonical categories" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr
                className={`border-b border-zinc-200 text-[11px] uppercase tracking-wide dark:border-zinc-700 ${adminMutedSoft}`}
              >
                <th className="pb-2 pr-3 font-semibold">Id</th>
                <th className="pb-2 pr-3 font-semibold">Customer label</th>
                <th className="pb-2 font-semibold">Agency aliases</th>
              </tr>
            </thead>
            <tbody>
              {workspace.categories.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-2.5 pr-3 font-mono text-xs">{c.id}</td>
                  <td className="py-2.5 pr-3 font-semibold">{c.label}</td>
                  <td className={`py-2.5 ${adminMuted}`}>
                    {c.agencyAliases.join(", ")}
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
