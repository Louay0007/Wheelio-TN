"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminField,
  AdminInput,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminTextarea,
  AdminTip,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit } from "@/lib/admin"

export default function AdminContentGuideEditorPage() {
  const { slug } = useParams<{ slug: string }>()
  const { session, ready, updateWorkspace } = useAdminSession()
  const [title, setTitle] = useState(slug.replaceAll("-", " "))
  const [body, setBody] = useState("Draft body for demo. Connect CMS to persist.")

  if (!ready || !session) {
    return (
      <AdminShell title="Guide editor">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  function saveDraft() {
    const actor = session!.name
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(ws, actor, "Saved guide draft", `Guide ${slug}`)
    })
  }

  return (
    <AdminShell
      title="Guide editor"
      description={`Slug: ${slug}`}
      actions={
        <>
          <AdminLinkButton href="/admin/content/guides" variant="secondary">
            Back
          </AdminLinkButton>
          <AdminLinkButton href={`/guides/${slug}`} variant="secondary">
            Customer preview
          </AdminLinkButton>
        </>
      }
    >
      <AdminTip>Stub editor. Changes audit only, not customer HTML.</AdminTip>
      <AdminPanel className="mt-4 max-w-2xl space-y-4">
        <AdminField label="Title">
          <AdminInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </AdminField>
        <AdminField label="Body">
          <AdminTextarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-48"
          />
        </AdminField>
        <AdminPrimaryButton type="button" onClick={saveDraft}>
          Save draft (audit)
        </AdminPrimaryButton>
      </AdminPanel>
    </AdminShell>
  )
}
