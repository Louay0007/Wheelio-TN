"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminPanel,
  AdminSecondaryButton,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { cn } from "@/lib/utils"

export default function AdminNotificationsPage() {
  const { workspace, updateWorkspace } = useAdminSession()
  const list = workspace?.notifications ?? []
  const unread = list.filter((n) => !n.read).length

  function markRead(id: string) {
    updateWorkspace((ws) => {
      if (!ws) return ws
      return {
        ...ws,
        notifications: ws.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
      }
    })
  }

  function markAllRead() {
    updateWorkspace((ws) => {
      if (!ws) return ws
      return {
        ...ws,
        notifications: ws.notifications.map((n) => ({ ...n, read: true })),
      }
    })
  }

  return (
    <AdminShell
      title="Notifications"
      description="In-app alerts for queues and money."
      actions={
        unread > 0 ? (
          <AdminSecondaryButton type="button" onClick={markAllRead}>
            Mark all read
          </AdminSecondaryButton>
        ) : null
      }
    >
      <div className="w-full space-y-4">
        <AdminPanel title="Inbox" hint={`${unread} unread`}>
          {list.length === 0 ? (
            <p className={cn("text-sm", adminMuted)}>No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {list.map((n) => (
                <li key={n.id} className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!n.read ? <AdminChip tone="strong">New</AdminChip> : null}
                      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {n.title}
                      </p>
                    </div>
                    <p className={cn("mt-1 text-sm", adminMuted)}>{n.body}</p>
                    <p className={cn("mt-1 font-mono text-xs", adminMutedSoft)}>
                      {new Date(n.at).toLocaleString()}
                    </p>
                    <Link
                      href={n.href}
                      className="mt-2 inline-block text-sm font-medium underline underline-offset-4"
                    >
                      Open related item
                    </Link>
                  </div>
                  {!n.read ? (
                    <AdminSecondaryButton type="button" onClick={() => markRead(n.id)}>
                      Mark read
                    </AdminSecondaryButton>
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
