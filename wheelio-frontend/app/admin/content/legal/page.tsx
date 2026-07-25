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

export default function AdminContentLegalPage() {
  const { workspace, session, ready, updateWorkspace } = useAdminSession()
  const { t } = useLocale()
  const [slug, setSlug] = useState("terms")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [locale, setLocale] = useState<"en" | "fr">("en")
  const rows = useMemo(
    () => (workspace?.cmsArticles ?? []).filter((a) => a.kind === "legal"),
    [workspace],
  )

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Legal">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Legal"
      description="Terms, privacy, cookies — draft/publish before counsel sign-off."
    >
      <div className="space-y-4">
        <AdminTip>
          Never publish unreviewed legal copy to production. Demo only stores text in
          localStorage.
        </AdminTip>
        <AdminPanel title="New / revise">
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
            <AdminTextarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
          </AdminField>
          <AdminPrimaryButton
            type="button"
            className="mt-3"
            onClick={() => {
              if (!slug.trim() || !title.trim()) return
              updateWorkspace((ws) => {
                if (!ws) return ws
                const row: AdminCmsArticle = {
                  id: `cms-legal-${Date.now()}`,
                  kind: "legal",
                  slug: slug.trim(),
                  title: title.trim(),
                  body: body.trim() || "…",
                  locale,
                  status: "draft",
                  updatedAt: new Date().toISOString(),
                }
                return pushAudit(
                  { ...ws, cmsArticles: [row, ...(ws.cmsArticles ?? [])] },
                  session.name,
                  `Legal draft ${row.slug}`,
                  row.id,
                )
              })
              setTitle("")
              setBody("")
            }}
          >
            {t("cms.save")} draft
          </AdminPrimaryButton>
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
                    onClick={() => {
                      updateWorkspace((ws) => {
                        if (!ws) return ws
                        const cmsArticles = (ws.cmsArticles ?? []).map((x) =>
                          x.id === a.id
                            ? {
                                ...x,
                                status:
                                  x.status === "published"
                                    ? ("draft" as const)
                                    : ("published" as const),
                                updatedAt: new Date().toISOString(),
                              }
                            : x,
                        )
                        return pushAudit(
                          { ...ws, cmsArticles },
                          session.name,
                          `Toggled legal ${a.slug}`,
                          a.id,
                        )
                      })
                    }}
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
