"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminPanel,
  AdminSecondaryButton,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit } from "@/lib/admin"
import { cn } from "@/lib/utils"

export default function AdminReviewsPage() {
  const { workspace, session, ready, updateWorkspace } = useAdminSession()

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Reviews">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const actorName = session.name

  function setStatus(id: string, status: "visible" | "hidden") {
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        {
          ...ws,
          reviews: ws.reviews.map((r) => (r.id === id ? { ...r, status } : r)),
        },
        actorName,
        status === "hidden" ? "Hid review" : "Restored review",
        `Review ${id}`,
      )
    })
  }

  return (
    <AdminShell
      title="Review moderation"
      description="Flagged reviews need a human. Hide removes from agency profile."
    >
      <AdminPanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className={cn("text-[11px] uppercase tracking-wide dark:border-zinc-700", adminMutedSoft)}>
                <th className="pb-2 pr-3 font-semibold">Author</th>
                <th className="pb-2 pr-3 font-semibold">Rating</th>
                <th className="pb-2 pr-3 font-semibold">Agency</th>
                <th className="pb-2 pr-3 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspace.reviews.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/admin/content/reviews/${r.id}`}
                      className="font-semibold underline underline-offset-4"
                    >
                      {r.author}
                    </Link>
                    <p className="line-clamp-1 text-xs text-zinc-500">{r.body}</p>
                  </td>
                  <td className="py-2.5 pr-3 font-mono tabular-nums">{r.rating}/5</td>
                  <td className="py-2.5 pr-3">{r.agencyName}</td>
                  <td className="py-2.5 pr-3">
                    <AdminChip tone={r.status === "flagged" ? "warn" : "neutral"}>
                      {r.status}
                    </AdminChip>
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-2">
                      {r.status !== "hidden" ? (
                        <AdminSecondaryButton
                          type="button"
                          className="h-9 px-2.5 text-xs"
                          onClick={() => setStatus(r.id, "hidden")}
                        >
                          Hide
                        </AdminSecondaryButton>
                      ) : (
                        <AdminSecondaryButton
                          type="button"
                          className="h-9 px-2.5 text-xs"
                          onClick={() => setStatus(r.id, "visible")}
                        >
                          Restore
                        </AdminSecondaryButton>
                      )}
                    </div>
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
