"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AdminBookingSubnav } from "@/components/admin/admin-booking-subnav"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminLinkButton,
  AdminPanel,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findBooking } from "@/lib/admin"
import { fetchAdminBookingTimeline } from "@/lib/gateways/admin"
import { useApiAdminSlice } from "@/lib/gateways/flags"
import { cn } from "@/lib/utils"

export default function AdminBookingTimelinePage() {
  const { id } = useParams<{ id: string }>()
  const { workspace, ready } = useAdminSession()
  const api = useApiAdminSlice()
  const booking = useMemo(
    () => (workspace ? findBooking(workspace, id) : undefined),
    [workspace, id],
  )
  const [timeline, setTimeline] = useState<
    Array<{
      toStatus: string
      fromStatus: string | null
      occurredAt: string
      reasonCode: string | null
    }>
  >([])
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState("")

  useEffect(() => {
    if (!api || !id) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminBookingTimeline(id)
      .then((row) => {
        if (!cancelled) {
          setTimeline(row.timeline)
          setReference(row.reference)
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
    if (loading) {
      return (
        <AdminShell title="Timeline">
          <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        </AdminShell>
      )
    }
    if (error) {
      return (
        <AdminShell title="Timeline">
          <p className="mb-3 text-sm text-red-600">{error}</p>
          <AdminLinkButton href={`/admin/bookings/${id}`} variant="secondary">
            Back
          </AdminLinkButton>
        </AdminShell>
      )
    }
    return (
      <AdminShell title={`${reference || id} · timeline`}>
        <AdminBookingSubnav bookingId={id} active="timeline" />
        <ul className="mt-4 space-y-3">
          {timeline.length === 0 ? (
            <AdminPanel>
              <p className={cn("text-sm", adminMutedSoft)}>No history yet</p>
            </AdminPanel>
          ) : (
            timeline.map((t, i) => (
              <li key={`${t.occurredAt}-${i}`}>
                <AdminPanel>
                  <div className="flex flex-wrap gap-2">
                    <AdminChip>{t.toStatus}</AdminChip>
                    {t.reasonCode ? (
                      <span className={cn("text-xs", adminMutedSoft)}>
                        {t.reasonCode}
                      </span>
                    ) : null}
                  </div>
                  <p className={cn("mt-2 text-xs", adminMutedSoft)}>
                    {new Date(t.occurredAt).toLocaleString()}
                    {t.fromStatus ? ` · from ${t.fromStatus}` : ""}
                  </p>
                </AdminPanel>
              </li>
            ))
          )}
        </ul>
      </AdminShell>
    )
  }

  if (!ready || !workspace || !booking) {
    return (
      <AdminShell title="Timeline">
        <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell title={`${booking.reference} · timeline`}>
      <AdminBookingSubnav bookingId={booking.id} active="timeline" />
      <ul className="mt-4 space-y-3">
        {booking.timeline.map((t, i) => (
          <li key={`${t.at}-${i}`}>
            <AdminPanel>
              <p className="font-medium">{t.label}</p>
              <p className={cn("mt-1 text-xs", adminMutedSoft)}>
                {new Date(t.at).toLocaleString()}
              </p>
            </AdminPanel>
          </li>
        ))}
      </ul>
    </AdminShell>
  )
}
