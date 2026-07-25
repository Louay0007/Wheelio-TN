"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminField,
  AdminInput,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit, type AdminCase } from "@/lib/admin"
import { createAdminCase } from "@/lib/gateways/admin"
import { useApiAdminSlice } from "@/lib/gateways/flags"

export default function AdminNewCasePage() {
  const router = useRouter()
  const { workspace, session, updateWorkspace, ready } = useAdminSession()
  const [subject, setSubject] = useState("")
  const [priority, setPriority] = useState<AdminCase["priority"]>("normal")
  const [channel, setChannel] = useState<AdminCase["channel"]>("in_app")
  const [bookingId, setBookingId] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const api = useApiAdminSlice()
  const [busy, setBusy] = useState(false)

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="New case">
        <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  function create() {
    if (!subject.trim()) {
      setError("Subject is required.")
      return
    }
    void (async () => {
      setBusy(true)
      setError(null)
      try {
        if (api) {
          const created = await createAdminCase({
            subject: subject.trim(),
            body: notes.trim() || undefined,
            priority,
            bookingId: bookingId.trim() || undefined,
          })
          router.push(`/admin/cases/${created.id}`)
          return
        }
        const booking = bookingId
          ? workspace!.bookings.find(
              (b) => b.id === bookingId || b.reference === bookingId.trim(),
            )
          : undefined
        const id = `case-${Date.now()}`
        const row: AdminCase = {
          id,
          subject: subject.trim(),
          status: "open",
          priority,
          bookingId: booking?.id,
          bookingRef: booking?.reference,
          agencyId: booking?.agencyId,
          agencyName: booking?.agencyName,
          customerName: booking?.customerName,
          ownerStaffId: session!.staffId,
          channel,
          tags: notes.trim() ? [notes.trim().slice(0, 40)] : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        updateWorkspace((ws) => {
          if (!ws) return ws
          return pushAudit(
            { ...ws, cases: [row, ...ws.cases] },
            session!.name,
            `Opened case: ${row.subject}`,
            `Case ${id}`,
          )
        })
        router.push(`/admin/cases/${id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Create failed")
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <AdminShell title="New case" description="Track support work before it becomes a claim.">
      <div className="w-full max-w-xl space-y-4">
        <AdminPanel>
          <AdminField label="Subject">
            <AdminInput value={subject} onChange={(e) => setSubject(e.target.value)} />
          </AdminField>
          <AdminField label="Priority">
            <AdminSelect
              value={priority}
              onChange={(e) => setPriority(e.target.value as AdminCase["priority"])}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="Channel">
            <AdminSelect
              value={channel}
              onChange={(e) => setChannel(e.target.value as AdminCase["channel"])}
            >
              <option value="in_app">In-app</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="Booking id or WTN ref (optional)">
            <AdminInput
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="WTN-881001"
            />
          </AdminField>
          <AdminField label="Tags / note">
            <AdminTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </AdminField>
          {error ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminPrimaryButton type="button" onClick={create} disabled={busy}>
              {busy ? "Creating…" : "Create case"}
            </AdminPrimaryButton>
            <AdminLinkButton href="/admin/cases" variant="secondary">
              Cancel
            </AdminLinkButton>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
