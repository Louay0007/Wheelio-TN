"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminField,
  AdminInput,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminTextarea,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit } from "@/lib/admin"

export default function AdminLocationEditPage() {
  const { slug } = useParams<{ slug: string }>()
  const { workspace, session, ready, updateWorkspace } = useAdminSession()
  const loc = workspace?.locations.find((l) => l.slug === slug)

  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [tip, setTip] = useState("")

  useEffect(() => {
    if (loc) {
      setName(loc.name)
      setCity(loc.city)
      setTip(loc.tip)
    }
  }, [loc])

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Location">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!loc) {
    return (
      <AdminShell title="Location not found">
        <AdminLinkButton href="/admin/locations" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  const actorName = session.name

  function persist(status: "draft" | "published") {
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        {
          ...ws,
          locations: ws.locations.map((l) =>
            l.slug === slug
              ? {
                  ...l,
                  name: name.trim() || l.name,
                  city: city.trim() || l.city,
                  tip: tip.trim(),
                  status,
                }
              : l,
          ),
        },
        actorName,
        status === "published" ? "Published location" : "Updated location draft",
        `Location ${slug}`,
      )
    })
  }

  return (
    <AdminShell
      title={loc.name}
      description={`/${slug} · ${loc.linkedAgencies} linked agencies`}
      actions={
        <>
          <AdminChip tone={loc.status === "published" ? "strong" : "neutral"}>
            {loc.status}
          </AdminChip>
          <AdminLinkButton href="/admin/locations" variant="secondary">
            All locations
          </AdminLinkButton>
        </>
      }
    >
      <AdminPanel className="max-w-xl space-y-4">
        <AdminField label="Display name">
          <AdminInput value={name} onChange={(e) => setName(e.target.value)} />
        </AdminField>
        <AdminField label="City">
          <AdminInput value={city} onChange={(e) => setCity(e.target.value)} />
        </AdminField>
        <AdminField label="Pickup tip">
          <AdminTextarea value={tip} onChange={(e) => setTip(e.target.value)} />
        </AdminField>
        <div className="flex flex-wrap gap-2 pt-2">
          <AdminSecondaryButton type="button" onClick={() => persist("draft")}>
            Save draft
          </AdminSecondaryButton>
          <AdminPrimaryButton type="button" onClick={() => persist("published")}>
            Save and publish
          </AdminPrimaryButton>
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
