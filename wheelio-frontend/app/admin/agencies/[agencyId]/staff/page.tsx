"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminPanel, adminMuted } from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findAgency } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminAgencyStaffPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const { workspace, session } = useAdminSession()
  const agency = useMemo(
    () => (workspace ? findAgency(workspace, agencyId) : undefined),
    [workspace, agencyId],
  )

  const stub = useMemo(
    () => [
      { name: "Desk manager", email: `desk@${agency?.slug ?? "partner"}.tn`, role: "Admin" },
      { name: "Fleet lead", email: `fleet@${agency?.slug ?? "partner"}.tn`, role: "Operator" },
    ],
    [agency],
  )

  if (!workspace || !session) {
    return (
      <AdminShell title="Staff">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!agency) {
    return (
      <AdminShell title="Staff">
        <p className="text-sm">Agency not found.</p>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Agency staff"
      description={agency.tradeName}
      actions={
        <Link href={`/admin/agencies/${agency.id}`} className="text-sm font-medium underline">
          Command center
        </Link>
      }
    >
      <AdminPanel title="Portal users (stub)">
        <ul className="space-y-2 text-sm">
          {stub.map((s) => (
            <li
              key={s.email}
              className="flex justify-between rounded-[8px] border border-zinc-200 px-3 py-2 dark:border-zinc-700"
            >
              <span>
                {s.name} · {s.email}
              </span>
              <span className={cn(adminMuted)}>{s.role}</span>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </AdminShell>
  )
}
