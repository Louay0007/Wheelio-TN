"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AdminBookingSubnav } from "@/components/admin/admin-booking-subnav"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminField,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSelect,
  AdminTextarea,
  AdminTip,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findBooking, pushAudit, roleCanSupport, roleLabel } from "@/lib/admin"
import {
  fetchAdminBookingMessages,
  postAdminBookingMessage,
} from "@/lib/gateways/admin"
import { useApiAdminSlice } from "@/lib/gateways/flags"
import { cn } from "@/lib/utils"

type MsgVisibility = "customer" | "agency" | "internal" | "both"

type DemoMsg = {
  id: string
  body: string
  visibility: MsgVisibility
  at: string
  author: string
}

export default function AdminBookingMessagesPage() {
  const { id } = useParams<{ id: string }>()
  const api = useApiAdminSlice()
  const { workspace, session, ready, updateWorkspace } = useAdminSession()
  const booking = useMemo(
    () => (workspace ? findBooking(workspace, id) : undefined),
    [workspace, id],
  )
  const [demoMsgs, setDemoMsgs] = useState<DemoMsg[]>([])
  const [apiMsgs, setApiMsgs] = useState<
    Awaited<ReturnType<typeof fetchAdminBookingMessages>>
  >([])
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState("")
  const [visibility, setVisibility] = useState<MsgVisibility>("both")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!api) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminBookingMessages(id)
      .then((rows) => {
        if (!cancelled) {
          setApiMsgs(rows)
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
  }, [api, id])

  if (api) {
    return (
      <AdminShell title="Messages">
        <AdminBookingSubnav bookingId={id} active="messages" />
        <AdminTip className="mt-4">
          Staff messages are labeled. Impersonation cannot POST.
        </AdminTip>
        {loading ? (
          <div className="mt-4 h-24 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        ) : (
          <div className="mt-4 space-y-4">
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <AdminPanel title="Send">
              <AdminField label="Visibility">
                <AdminSelect
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as MsgVisibility)
                  }
                >
                  <option value="both">Customer + agency</option>
                  <option value="customer">Customer only</option>
                  <option value="agency">Agency only</option>
                  <option value="internal">Internal</option>
                </AdminSelect>
              </AdminField>
              <AdminField label="Message">
                <AdminTextarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                />
              </AdminField>
              <AdminPrimaryButton
                type="button"
                disabled={busy || !body.trim()}
                onClick={() => {
                  setBusy(true)
                  void postAdminBookingMessage(id, { body: body.trim(), visibility })
                    .then(async () => {
                      setBody("")
                      setApiMsgs(await fetchAdminBookingMessages(id))
                    })
                    .catch((err: unknown) => {
                      setError(
                        err instanceof Error ? err.message : "Send failed",
                      )
                    })
                    .finally(() => setBusy(false))
                }}
              >
                {busy ? "Sending…" : "Send as staff"}
              </AdminPrimaryButton>
            </AdminPanel>
            <ul className="space-y-3">
              {apiMsgs.map((m) => (
                <li key={m.id}>
                  <AdminPanel>
                    <div className="flex flex-wrap gap-2">
                      <AdminChip>{m.visibility}</AdminChip>
                      {m.staffMarked ? <AdminChip>staff</AdminChip> : null}
                      <span className={cn("text-xs", adminMutedSoft)}>
                        {m.authorClass} ·{" "}
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className={cn("mt-2 text-sm", adminMuted)}>{m.body}</p>
                  </AdminPanel>
                </li>
              ))}
            </ul>
            {apiMsgs.length === 0 ? (
              <p className={cn("text-sm", adminMutedSoft)}>No messages yet</p>
            ) : null}
          </div>
        )}
        <AdminLinkButton
          href={`/admin/bookings/${id}`}
          variant="secondary"
          className="mt-4"
        >
          Back to booking
        </AdminLinkButton>
      </AdminShell>
    )
  }

  if (!ready || !workspace || !session || !booking) {
    return (
      <AdminShell title="Messages">
        <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const canWrite = roleCanSupport(session.role)

  function send() {
    if (!body.trim() || !canWrite) return
    const msg: DemoMsg = {
      id: `msg-${Date.now()}`,
      body: body.trim(),
      visibility,
      at: new Date().toISOString(),
      author: session!.name,
    }
    setDemoMsgs((m) => [msg, ...m])
    setBody("")
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        ws,
        session!.name,
        `Staff message (${visibility})`,
        `Booking ${booking!.reference}`,
      )
    })
  }

  return (
    <AdminShell title={`${booking.reference} · messages`}>
      <AdminBookingSubnav bookingId={booking.id} active="messages" />
      <AdminTip>
        Demo thread. Mark visibility carefully — Wheelio staff messages are
        labeled in production.
      </AdminTip>
      {canWrite ? (
        <AdminPanel className="mt-4" title="Send">
          <AdminField label="Visibility">
            <AdminSelect
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as MsgVisibility)}
            >
              <option value="both">Customer + agency</option>
              <option value="customer">Customer only</option>
              <option value="agency">Agency only</option>
              <option value="internal">Internal</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="Message">
            <AdminTextarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
          </AdminField>
          <AdminPrimaryButton type="button" onClick={send}>
            Send as {roleLabel(session.role)}
          </AdminPrimaryButton>
        </AdminPanel>
      ) : null}
      <ul className="mt-4 space-y-3">
        {demoMsgs.map((m) => (
          <li key={m.id}>
            <AdminPanel>
              <div className="flex flex-wrap gap-2">
                <AdminChip>{m.visibility}</AdminChip>
                <span className={cn("text-xs", adminMutedSoft)}>
                  {m.author}
                </span>
              </div>
              <p className={cn("mt-2 text-sm", adminMuted)}>{m.body}</p>
            </AdminPanel>
          </li>
        ))}
      </ul>
      {demoMsgs.length === 0 ? (
        <p className={cn("mt-4 text-sm", adminMutedSoft)}>No messages yet</p>
      ) : null}
      <AdminLinkButton
        href={`/admin/bookings/${booking.id}`}
        variant="secondary"
        className="mt-4"
      >
        Back to booking
      </AdminLinkButton>
    </AdminShell>
  )
}
