"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyLinkButton,
  AgencyPrimaryButton,
  AgencyTip,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import {
  fetchAgencyNotifications,
  markAgencyNotificationsRead,
} from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

export default function NotificationsPage() {
  const api = useApiAgencySlice()
  const { workspace, updateWorkspace } = useAgencySession()
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof fetchAgencyNotifications>>
  >([])
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!api) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyNotifications()
      .then((rows) => {
        if (!cancelled) {
          setItems(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  async function markAll() {
    try {
      await markAgencyNotificationsRead({ all: true })
      setItems(await fetchAgencyNotifications())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <AgencyShell
      title="Notifications"
      description="New requests, messages, cancellations, payouts."
      actions={
        <>
          {api ? (
            <AgencyPrimaryButton type="button" onClick={() => void markAll()}>
              Mark all read
            </AgencyPrimaryButton>
          ) : null}
          <AgencyLinkButton
            href="/agency/notifications/settings"
            variant="secondary"
          >
            Settings
          </AgencyLinkButton>
        </>
      }
    >
      {api ? (
        <>
          <AgencyTip>In-app inbox · preferences under Settings.</AgencyTip>
          {loading ? (
            <div className="mt-4 h-24 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
          ) : (
            <div className="mt-4 space-y-2">
              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
              <ul className="space-y-2">
                {items.length === 0 ? (
                  <li className="text-sm text-zinc-500">Inbox empty.</li>
                ) : (
                  items.map((n) => (
                    <li key={n.id}>
                      {n.href ? (
                        <Link
                          href={n.href}
                          onClick={() => {
                            void markAgencyNotificationsRead({ ids: [n.id] })
                          }}
                          className="block rounded-[10px] border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700"
                        >
                          <span className={n.read ? "opacity-60" : "font-semibold"}>
                            {n.title}
                          </span>
                          {n.body ? (
                            <p className="mt-1 text-zinc-500">{n.body}</p>
                          ) : null}
                        </Link>
                      ) : (
                        <div className="rounded-[10px] border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700">
                          {n.title}
                        </div>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </>
      ) : (
        <ul className="space-y-2">
          {(workspace?.notifications ?? []).map((n) => (
            <li key={n.id}>
              <Link
                href={n.href}
                onClick={() =>
                  updateWorkspace((ws) => {
                    if (!ws) return ws
                    return {
                      ...ws,
                      notifications: ws.notifications.map((x) =>
                        x.id === n.id ? { ...x, read: true } : x,
                      ),
                    }
                  })
                }
                className="block rounded-[10px] border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700"
              >
                {n.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AgencyShell>
  )
}
