"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminField,
  AdminInput,
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
import {
  pushAudit,
  type AdminCmsArticle,
} from "@/lib/admin"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

function ensureArticles(ws: { cmsArticles?: AdminCmsArticle[] }) {
  return ws.cmsArticles ?? []
}

export default function AdminContentGuidesPage() {
  const { workspace, session, ready, updateWorkspace } = useAdminSession()
  const { t } = useLocale()
  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [locale, setLocale] = useState<"en" | "fr">("en")
  const [flash, setFlash] = useState<string | null>(null)

  const guides = useMemo(
    () =>
      ensureArticles(workspace ?? {}).filter((a) => a.kind === "guide"),
    [workspace],
  )

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Guides">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  function saveDraft() {
    if (!slug.trim() || !title.trim()) {
      setFlash("Slug and title required.")
      return
    }
    const id = `cms-guide-${Date.now()}`
    updateWorkspace((ws) => {
      if (!ws) return ws
      const articles = ensureArticles(ws)
      const row: AdminCmsArticle = {
        id,
        kind: "guide",
        slug: slug.trim(),
        title: title.trim(),
        body: body.trim() || "…",
        locale,
        status: "draft",
        updatedAt: new Date().toISOString(),
      }
      return pushAudit(
        { ...ws, cmsArticles: [row, ...articles] },
        session!.name,
        `Guide draft ${row.slug}`,
        row.id,
      )
    })
    setSlug("")
    setTitle("")
    setBody("")
    setFlash("Draft saved.")
  }

  function togglePublish(id: string) {
    updateWorkspace((ws) => {
      if (!ws) return ws
      const articles = ensureArticles(ws).map((a) => {
        if (a.id !== id) return a
        const nextStatus = a.status === "published" ? "draft" : "published"
        return {
          ...a,
          status: nextStatus as "draft" | "published",
          updatedAt: new Date().toISOString(),
          publishAt:
            nextStatus === "published" ? new Date().toISOString() : a.publishAt,
        }
      })
      const target = articles.find((a) => a.id === id)
      return pushAudit(
        { ...ws, cmsArticles: articles },
        session!.name,
        `${target?.status === "published" ? "Published" : "Unpublished"} ${target?.slug}`,
        id,
      )
    })
  }

  return (
    <AdminShell
      title="Guides"
      description="Publish tooling (EN / FR). Customer pages under /guides."
      actions={
        <AdminLinkButton href="/guides" variant="secondary">
          View customer /guides
        </AdminLinkButton>
      }
    >
      <div className="space-y-4">
        {flash ? (
          <p className="text-sm" role="status">
            {flash}
          </p>
        ) : null}
        <AdminTip>
          Demo CMS stores articles in the admin workspace. Publish toggles status and
          audit; no CDN yet.
        </AdminTip>

        <AdminPanel title="New guide">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Slug">
              <AdminInput value={slug} onChange={(e) => setSlug(e.target.value)} />
            </AdminField>
            <AdminField label="Locale">
              <AdminSelect
                value={locale}
                onChange={(e) => setLocale(e.target.value as "en" | "fr")}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </AdminSelect>
            </AdminField>
          </div>
          <AdminField label="Title">
            <AdminInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </AdminField>
          <AdminField label="Body">
            <AdminTextarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </AdminField>
          <div className="mt-3">
            <AdminPrimaryButton type="button" onClick={saveDraft}>
              {t("cms.save")} draft
            </AdminPrimaryButton>
          </div>
        </AdminPanel>

        <AdminPanel title="Catalog">
          <ul className="space-y-3 text-sm">
            {guides.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800"
              >
                <div>
                  <Link
                    href={`/admin/content/guides/${g.slug}`}
                    className="font-semibold underline underline-offset-4"
                  >
                    {g.title}
                  </Link>
                  <p className={cn("mt-0.5 font-mono text-xs", adminMuted)}>
                    /{g.slug} · {g.locale.toUpperCase()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminChip tone={g.status === "published" ? "strong" : "neutral"}>
                    {g.status === "published" ? t("cms.published") : t("cms.draft")}
                  </AdminChip>
                  <AdminSecondaryButton
                    type="button"
                    className="h-9 text-xs"
                    onClick={() => togglePublish(g.id)}
                  >
                    {g.status === "published" ? t("cms.unpublish") : t("cms.publish")}
                  </AdminSecondaryButton>
                  <AdminLinkButton
                    href={`/guides/${g.slug}`}
                    variant="secondary"
                    className="h-9 text-xs"
                  >
                    Preview
                  </AdminLinkButton>
                </div>
              </li>
            ))}
            {guides.length === 0 ? (
              <li className={cn("text-sm", adminMuted)}>No guides yet.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
