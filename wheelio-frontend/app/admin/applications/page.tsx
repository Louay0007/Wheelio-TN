"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminEmpty,
  AdminLinkButton,
  AdminPanel,
  AdminSelect,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import type { ApplicationStatus } from "@/lib/admin"
import { fetchAdminPartnerApplications } from "@/lib/gateways/admin"
import { useApiAdminSlice } from "@/lib/gateways/flags"
import { cn } from "@/lib/utils"

type ApiApp = {
  id: string
  status: string
  tradeName: string
  legalName: string
  city: string
  email: string
  phone: string
  fleetSizeEstimate: number
  submittedAt: string
}

export default function ApplicationsPage() {
  const { workspace, ready } = useAdminSession()
  const api = useApiAdminSlice()
  const [status, setStatus] = useState<ApplicationStatus | "open" | "all">(
    "open",
  )
  const [apiRows, setApiRows] = useState<ApiApp[] | null>(null)
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!api) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminPartnerApplications()
      .then((rows) => {
        if (!cancelled) {
          setApiRows(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setApiRows([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  const demoRows = useMemo(() => {
    if (!workspace) return []
    return workspace.applications
      .filter((a) => {
        if (status === "all") return true
        if (status === "open")
          return ["new", "docs_requested", "in_review"].includes(a.status)
        return a.status === status
      })
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )
  }, [workspace, status])

  const rows = useMemo(() => {
    if (!api) return demoRows
    return (apiRows ?? [])
      .filter((a) => {
        if (status === "all") return true
        if (status === "open")
          return ["new", "docs_requested", "in_review"].includes(a.status)
        return a.status === status
      })
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )
  }, [api, apiRows, demoRows, status])

  return (
    <AdminShell
      title="Partner applications"
      description="Turn join forms into verified agencies or clear rejections."
    >
      {(api ? loading : !ready || !workspace) ? (
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <AdminSelect
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as ApplicationStatus | "open" | "all")
            }
            className="max-w-xs"
            aria-label="Filter status"
          >
            <option value="open">Needs action</option>
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="docs_requested">Docs requested</option>
            <option value="in_review">In review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </AdminSelect>

          {rows.length === 0 ? (
            <AdminEmpty
              title="Queue clear"
              body="No applications in this filter."
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((a) => (
                <li key={a.id}>
                  <AdminPanel
                    action={
                      <AdminLinkButton href={`/admin/applications/${a.id}`}>
                        Review
                      </AdminLinkButton>
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{a.tradeName}</p>
                      <AdminChip
                        tone={
                          a.status === "new" || a.status === "in_review"
                            ? "strong"
                            : "neutral"
                        }
                      >
                        {a.status.replaceAll("_", " ")}
                      </AdminChip>
                    </div>
                    <p className={cn("mt-1 text-sm", adminMuted)}>
                      {a.city} · {a.fleetSizeEstimate} cars · {a.email}
                    </p>
                    <p className={cn("mt-1 text-xs", adminMutedSoft)}>
                      Submitted {new Date(a.submittedAt).toLocaleString()}
                    </p>
                  </AdminPanel>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AdminShell>
  )
}
