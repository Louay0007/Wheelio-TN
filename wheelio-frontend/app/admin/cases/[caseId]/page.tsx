"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminField,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSelect,
  AdminTextarea,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit } from "@/lib/admin"
import { fetchAdminCase, updateAdminCase } from "@/lib/gateways/admin"
import { useApiAdminSlice } from "@/lib/gateways/flags"
import { cn } from "@/lib/utils"

export default function AdminCaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const { workspace, session, updateWorkspace, ready } = useAdminSession()
  const api = useApiAdminSlice()
  const item = useMemo(
    () => workspace?.cases.find((c) => c.id === caseId),
    [workspace, caseId],
  )
  const [outcome, setOutcome] = useState("resolved_info")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiCase, setApiCase] = useState<Awaited<
    ReturnType<typeof fetchAdminCase>
  > | null>(null)
  const [apiLoading, setApiLoading] = useState(api)
  const [version, setVersion] = useState(1)

  useEffect(() => {
    if (!api || !caseId) {
      setApiLoading(false)
      return
    }
    let cancelled = false
    fetchAdminCase(caseId)
      .then((row) => {
        if (!cancelled) {
          setApiCase(row)
          setVersion(row.version)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setApiCase(null)
        }
      })
      .finally(() => {
        if (!cancelled) setApiLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, caseId])

  if (api) {
    if (apiLoading) {
      return (
        <AdminShell title="Case">
          <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        </AdminShell>
      )
    }
    if (error && !apiCase) {
      return (
        <AdminShell title="Not found">
          <p className="mb-3 text-sm text-red-600">{error}</p>
          <AdminLinkButton href="/admin/cases" variant="secondary">
            Back
          </AdminLinkButton>
        </AdminShell>
      )
    }
    if (!apiCase) return null

    async function resolveApi() {
      setBusy(true)
      setError(null)
      try {
        const updated = await updateAdminCase(apiCase!.id, {
          expectedVersion: version,
          status: outcome === "escalated" ? "escalated" : "resolved",
          note: note.trim() || undefined,
          outcomeTag: outcome,
        })
        setVersion(updated.version)
        setApiCase({
          ...apiCase!,
          status: updated.status,
          version: updated.version,
        })
        setNote("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed")
      } finally {
        setBusy(false)
      }
    }

    return (
      <AdminShell
        title={apiCase.subject}
        description={`Status ${apiCase.status}`}
        actions={
          <>
            <AdminChip
              tone={apiCase.priority === "high" ? "strong" : "neutral"}
            >
              {apiCase.priority}
            </AdminChip>
            <AdminChip>{apiCase.status}</AdminChip>
          </>
        }
      >
        <div className="w-full max-w-xl space-y-4">
          <AdminPanel>
            <AdminKeyValue
              rows={[
                { label: "Booking", value: apiCase.bookingId ?? "—" },
                { label: "Agency", value: apiCase.agencyId ?? "—" },
                {
                  label: "Updated",
                  value: new Date(apiCase.updatedAt).toLocaleString(),
                },
                { label: "Tags", value: apiCase.tags.join(" · ") || "—" },
                { label: "Version", value: String(version) },
              ]}
            />
            {apiCase.body ? (
              <p className={cn("mt-3 text-sm", adminMuted)}>{apiCase.body}</p>
            ) : null}
          </AdminPanel>
          {apiCase.notes && apiCase.notes.length > 0 ? (
            <AdminPanel title="Timeline">
              <ul className={cn("space-y-2 text-sm", adminMuted)}>
                {apiCase.notes.map((n) => (
                  <li key={n.id}>
                    {new Date(n.createdAt).toLocaleString()}
                    {n.toStatus ? ` · ${n.fromStatus} → ${n.toStatus}` : ""}:{" "}
                    {n.body}
                  </li>
                ))}
              </ul>
            </AdminPanel>
          ) : null}
          <AdminPanel title="Resolve / update">
            <AdminField label="Outcome">
              <AdminSelect
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              >
                <option value="resolved_info">Info provided</option>
                <option value="resolved_policy">Policy applied</option>
                <option value="escalated">Escalate</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Note">
              <AdminTextarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </AdminField>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <AdminPrimaryButton
              type="button"
              disabled={busy}
              onClick={() => void resolveApi()}
            >
              {busy ? "Saving…" : "Save status + note"}
            </AdminPrimaryButton>
          </AdminPanel>
        </div>
      </AdminShell>
    )
  }

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Case">
        <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!item) {
    return (
      <AdminShell title="Not found">
        <AdminLinkButton href="/admin/cases" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  function resolve() {
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        {
          ...ws,
          cases: ws.cases.map((c) =>
            c.id === item!.id
              ? {
                  ...c,
                  status: "resolved",
                  tags: [...c.tags, outcome, note.trim()].filter(Boolean),
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        },
        session!.name,
        `Resolved case (${outcome})`,
        `Case ${item!.id}`,
      )
    })
  }

  return (
    <AdminShell
      title={item.subject}
      description={`Status ${item.status}`}
      actions={
        <>
          <AdminChip tone={item.priority === "high" ? "strong" : "neutral"}>
            {item.priority}
          </AdminChip>
          <AdminChip>{item.status}</AdminChip>
        </>
      }
    >
      <div className="w-full max-w-xl space-y-4">
        <AdminPanel>
          <AdminKeyValue
            rows={[
              {
                label: "Booking",
                value: item.bookingRef ?? item.bookingId ?? "—",
              },
              { label: "Agency", value: item.agencyName ?? "—" },
              { label: "Customer", value: item.customerName ?? "—" },
              { label: "Channel", value: item.channel },
            ]}
          />
        </AdminPanel>
        <AdminPanel title="Resolve (demo)">
          <AdminField label="Outcome">
            <AdminSelect
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="resolved_info">Info provided</option>
              <option value="resolved_policy">Policy applied</option>
              <option value="escalated">Escalate</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="Note">
            <AdminTextarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </AdminField>
          <AdminPrimaryButton type="button" onClick={resolve}>
            Mark resolved
          </AdminPrimaryButton>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
