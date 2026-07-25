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
  AdminTextarea,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit, type AdminLocation } from "@/lib/admin"

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function AdminLocationNewPage() {
  const router = useRouter()
  const { session, ready, updateWorkspace } = useAdminSession()
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [tip, setTip] = useState("")

  if (!ready || !session) {
    return (
      <AdminShell title="New location">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const actorName = session.name

  function save(asPublished: boolean) {
    const slug = slugify(name) || `loc-${Date.now()}`
    const loc: AdminLocation = {
      slug,
      name: name.trim() || "Untitled",
      city: city.trim() || "Tunis",
      status: asPublished ? "published" : "draft",
      linkedAgencies: 0,
      tip: tip.trim(),
    }
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        { ...ws, locations: [...ws.locations, loc] },
        actorName,
        asPublished ? "Published location" : "Created location draft",
        `Location ${slug}`,
      )
    })
    router.push(`/admin/locations/${slug}`)
  }

  return (
    <AdminShell
      title="New location"
      description="Draft first, publish when desk copy is ready."
      actions={
        <AdminLinkButton href="/admin/locations" variant="secondary">
          Cancel
        </AdminLinkButton>
      }
    >
      <AdminPanel className="max-w-xl space-y-4">
        <AdminField label="Display name">
          <AdminInput value={name} onChange={(e) => setName(e.target.value)} />
        </AdminField>
        <AdminField label="City">
          <AdminInput value={city} onChange={(e) => setCity(e.target.value)} />
        </AdminField>
        <AdminField label="Pickup tip" hint="Shown on customer location page.">
          <AdminTextarea value={tip} onChange={(e) => setTip(e.target.value)} />
        </AdminField>
        <div className="flex flex-wrap gap-2 pt-2">
          <AdminPrimaryButton type="button" onClick={() => save(false)}>
            Save draft
          </AdminPrimaryButton>
          <AdminPrimaryButton type="button" onClick={() => save(true)}>
            Save and publish
          </AdminPrimaryButton>
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
