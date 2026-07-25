"use client"

import { useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminSelect,
  AdminTextarea,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit, type AdminCmsArticle } from "@/lib/admin"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

function articlesOf(
  ws: { cmsArticles?: AdminCmsArticle[] } | null | undefined,
  kind: AdminCmsArticle["kind"],
) {
  return (ws?.cmsArticles ?? []).filter((a) => a.kind === kind)
}

function CmsKindPage({
  kind,
  title,
  description,
}: {
  kind: AdminCmsArticle["kind"]
  title: string
  description: string
}) {
  const { workspace, session, ready, updateWorkspace } = useAdminSession()
  const { t } = useLocale()
  const [slug, setSlug] = useState("")
  const [articleTitle, setArticleTitle] = useState("")
  const [body, setBody] = useState("")
  const [locale, setLocale] = useState<"en" | "fr">("en")

  const rows = useMemo(() => articlesOf(workspace, kind), [workspace, kind])

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title={title}>
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  function save() {
    if (!slug.trim() || !articleTitle.trim()) return
    updateWorkspace((ws) => {
      if (!ws) return ws
      const row: AdminCmsArticle = {
        id: `cms-${kind}-${Date.now()}`,
        kind,
        slug: slug.trim(),
        title: articleTitle.trim(),
        body: body.trim() || "…",
        locale,
        status: "draft",
        updatedAt: new Date().toISOString(),
      }
      return pushAudit(
        { ...ws, cmsArticles: [row, ...(ws.cmsArticles ?? [])] },
        session!.name,
        `${kind} draft ${row.slug}`,
        row.id,
      )
    })
    setSlug("")
    setArticleTitle("")
    setBody("")
  }

  function toggle(id: string) {
    updateWorkspace((ws) => {
      if (!ws) return ws
      const cmsArticles = (ws.cmsArticles ?? []).map((a) => {
        if (a.id !== id) return a
        const status = a.status === "published" ? "draft" : "published"
        return {
          ...a,
          status: status as "draft" | "published",
          updatedAt: new Date().toISOString(),
          publishAt: status === "published" ? new Date().toISOString() : a.publishAt,
        }
      })
      return pushAudit(
        { ...ws, cmsArticles },
        session!.name,
        `Toggled publish ${id}`,
        id,
      )
    })
  }

  return (
    <AdminShell title={title} description={description}>
      <div className="space-y-4">
        <AdminTip>
          EN / FR only. Publish writes status into the demo admin workspace.
        </AdminTip>
        <AdminPanel title={`New ${kind}`}>
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
            <AdminInput
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
            />
          </AdminField>
          <AdminField label="Body">
            <AdminTextarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          </AdminField>
          <div className="mt-3">
            <AdminPrimaryButton type="button" onClick={save}>
              {t("cms.save")} draft
            </AdminPrimaryButton>
          </div>
        </AdminPanel>
        <AdminPanel title="Catalog">
          <ul className="space-y-2 text-sm">
            {rows.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800"
              >
                <div>
                  <span className="font-medium">{a.title}</span>
                  <p className={cn("font-mono text-xs", adminMuted)}>
                    /{a.slug} · {a.locale.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AdminChip tone={a.status === "published" ? "strong" : "neutral"}>
                    {a.status === "published" ? t("cms.published") : t("cms.draft")}
                  </AdminChip>
                  <AdminSecondaryButton
                    type="button"
                    className="h-9 text-xs"
                    onClick={() => toggle(a.id)}
                  >
                    {a.status === "published" ? t("cms.unpublish") : t("cms.publish")}
                  </AdminSecondaryButton>
                </div>
              </li>
            ))}
            {rows.length === 0 ? (
              <li className={cn("text-sm", adminMuted)}>Empty.</li>
            ) : null}
          </ul>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}

export default function AdminContentHelpPage() {
  return (
    <CmsKindPage
      kind="help"
      title="Help center"
      description="Support articles with draft / publish."
    />
  )
}
