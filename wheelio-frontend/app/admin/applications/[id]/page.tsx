"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminField,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminSelect,
  AdminTextarea,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit, type AdminAgency } from "@/lib/admin"
import {
  approvePartnerApplication,
  fetchAdminPartnerApplication,
  rejectPartnerApplication,
  requestPartnerApplicationDocs,
} from "@/lib/gateways/admin"
import { useApiAdminSlice } from "@/lib/gateways/flags"
import { cn } from "@/lib/utils"

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { workspace, session, updateWorkspace, ready } = useAdminSession()
  const api = useApiAdminSlice()
  const demoApp = workspace?.applications.find((a) => a.id === id)
  const [rejectReason, setRejectReason] = useState("incomplete_docs")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiApp, setApiApp] = useState<Awaited<
    ReturnType<typeof fetchAdminPartnerApplication>
  > | null>(null)
  const [apiLoading, setApiLoading] = useState(api)

  useEffect(() => {
    if (!api || !id) {
      setApiLoading(false)
      return
    }
    let cancelled = false
    fetchAdminPartnerApplication(id)
      .then((row) => {
        if (!cancelled) {
          setApiApp(row)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setApiApp(null)
        }
      })
      .finally(() => {
        if (!cancelled) setApiLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, id])

  if (api) {
    if (apiLoading) {
      return (
        <AdminShell title="Application">
          <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        </AdminShell>
      )
    }
    if (error || !apiApp) {
      return (
        <AdminShell title="Not found">
          <p className="mb-3 text-sm text-red-600">{error}</p>
          <AdminLinkButton href="/admin/applications" variant="secondary">
            Back
          </AdminLinkButton>
        </AdminShell>
      )
    }
    const open = ["new", "docs_requested", "in_review"].includes(apiApp.status)
    return (
      <AdminShell
        title={apiApp.tradeName}
        description={`${apiApp.city} · ${apiApp.email}`}
        actions={<AdminChip>{apiApp.status.replaceAll("_", " ")}</AdminChip>}
      >
        <div className="w-full max-w-xl space-y-4">
          <AdminPanel>
            <AdminKeyValue
              rows={[
                { label: "Legal name", value: apiApp.legalName },
                { label: "Phone", value: apiApp.phone },
                {
                  label: "Fleet estimate",
                  value: String(apiApp.fleetSizeEstimate),
                },
                {
                  label: "Branches planned",
                  value: String(apiApp.branchesPlanned),
                },
                {
                  label: "Submitted",
                  value: new Date(apiApp.submittedAt).toLocaleString(),
                },
              ]}
            />
          </AdminPanel>
          <AdminField label="Internal note">
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
          {open ? (
            <div className="flex flex-wrap gap-2">
              <AdminPrimaryButton
                type="button"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true)
                    setError(null)
                    try {
                      const res = await approvePartnerApplication(apiApp.id, {
                        expectedVersion: apiApp.version,
                        verificationStatus: "review",
                        note: note || undefined,
                      })
                      router.push(`/admin/agencies/${res.agencyId}`)
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "Approve failed",
                      )
                    } finally {
                      setBusy(false)
                    }
                  })()
                }}
              >
                Approve → review
              </AdminPrimaryButton>
              <AdminSecondaryButton
                type="button"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true)
                    try {
                      await requestPartnerApplicationDocs(apiApp.id, {
                        expectedVersion: apiApp.version,
                        message: note || undefined,
                      })
                      window.location.reload()
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "Request failed",
                      )
                    } finally {
                      setBusy(false)
                    }
                  })()
                }}
              >
                Request docs
              </AdminSecondaryButton>
            </div>
          ) : null}
          {open ? (
            <AdminPanel title="Reject">
              <AdminSelect
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              >
                <option value="incomplete_docs">Incomplete docs</option>
                <option value="ineligible">Ineligible</option>
                <option value="duplicate">Duplicate</option>
                <option value="other">Other</option>
              </AdminSelect>
              <AdminSecondaryButton
                type="button"
                className="mt-3"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true)
                    try {
                      await rejectPartnerApplication(apiApp.id, {
                        expectedVersion: apiApp.version,
                        reasonCode: rejectReason as
                          | "incomplete_docs"
                          | "ineligible"
                          | "duplicate"
                          | "other",
                        message: note || undefined,
                      })
                      router.push("/admin/applications")
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "Reject failed",
                      )
                    } finally {
                      setBusy(false)
                    }
                  })()
                }}
              >
                Reject application
              </AdminSecondaryButton>
            </AdminPanel>
          ) : null}
          {apiApp.notes.length > 0 ? (
            <AdminPanel title="Notes">
              <ul className={cn("space-y-2 text-sm", adminMuted)}>
                {apiApp.notes.map((n) => (
                  <li key={n.id}>
                    {new Date(n.createdAt).toLocaleString()}: {n.body}
                  </li>
                ))}
              </ul>
            </AdminPanel>
          ) : null}
          <AdminTip>
            Approval creates a real agency row (EN+FR profiles). Deposit never
            enters agency payout math.
          </AdminTip>
        </div>
      </AdminShell>
    )
  }

  if (!ready || !workspace) {
    return (
      <AdminShell title="Application">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!demoApp) {
    return (
      <AdminShell title="Not found">
        <AdminLinkButton href="/admin/applications" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  function approve(verification: "review" | "live") {
    if (!workspace || !session || !demoApp) return
    const agencyId = `agency-from-${demoApp.id}`
    const agency: AdminAgency = {
      id: agencyId,
      slug: demoApp.tradeName.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
      tradeName: demoApp.tradeName,
      legalName: demoApp.legalName,
      city: demoApp.city,
      email: demoApp.email,
      phone: demoApp.phone,
      verification,
      commissionTier: "launch",
      takeRatePercent: 10,
      instantEnabled: false,
      qualityScore: 50,
      acceptanceRate: 0,
      avgResponseHours: 0,
      gmv30dTnd: 0,
      openSlaBreaches: 0,
      vehicleCount: 0,
      branchCount: demoApp.branchesPlanned,
      lastActiveLabel: "Just approved",
      ibanLast4: "0000",
      publicVisible: verification === "live",
    }
    updateWorkspace((ws) => {
      if (!ws) return ws
      let next = {
        ...ws,
        applications: ws.applications.map((a) =>
          a.id === demoApp.id
            ? { ...a, status: "approved" as const, notes: note || a.notes }
            : a,
        ),
        agencies: ws.agencies.some((a) => a.id === agencyId)
          ? ws.agencies
          : [...ws.agencies, agency],
      }
      next = pushAudit(
        next,
        session.name,
        `Approved application → ${verification}`,
        `Application ${demoApp.id}`,
      )
      return next
    })
    router.push(`/admin/agencies/${agencyId}`)
  }

  return (
    <AdminShell
      title={demoApp.tradeName}
      description={`${demoApp.city} · ${demoApp.email}`}
      actions={<AdminChip>{demoApp.status.replaceAll("_", " ")}</AdminChip>}
    >
      <div className="w-full max-w-xl space-y-4">
        <AdminPanel>
          <AdminKeyValue
            rows={[
              { label: "Legal name", value: demoApp.legalName },
              { label: "Phone", value: demoApp.phone },
              {
                label: "Fleet estimate",
                value: String(demoApp.fleetSizeEstimate),
              },
            ]}
          />
        </AdminPanel>
        <AdminField label="Note">
          <AdminTextarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </AdminField>
        <div className="flex flex-wrap gap-2">
          <AdminPrimaryButton type="button" onClick={() => approve("review")}>
            Approve → review
          </AdminPrimaryButton>
          <AdminSecondaryButton type="button" onClick={() => approve("live")}>
            Approve → live
          </AdminSecondaryButton>
        </div>
      </div>
    </AdminShell>
  )
}
