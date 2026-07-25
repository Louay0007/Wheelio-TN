import { and, desc, eq, inArray, isNull } from "drizzle-orm"
import {
  cmsEntries,
  cmsPublications,
  cmsRevisions,
} from "@/db/schema"
import type { AppLocale } from "@/server/contracts/pagination"
import { getDb } from "@/server/core/database/client"
import { notFound, validationError } from "@/server/core/errors/app-error"
import { localeSchema } from "@/server/contracts/pagination"

export type PublishedCmsItem = {
  kind: string
  slug: string
  locale: AppLocale
  title: string
  body: string
  structuredContent: string | null
  revision: number
  publishedAt: string
}

export async function listPublishedContent(opts: {
  kind: string
  locale: string
}) {
  const locale = parseLocale(opts.locale)
  const db = getDb()
  const fallbackLocale = locale === "en" ? "fr" : "en"
  const rows = await db
    .select({
      kind: cmsEntries.kind,
      slug: cmsEntries.slug,
      locale: cmsPublications.locale,
      title: cmsRevisions.title,
      body: cmsRevisions.body,
      structuredContent: cmsRevisions.structuredContent,
      revision: cmsRevisions.revision,
      publishedAt: cmsPublications.publishedAt,
    })
    .from(cmsPublications)
    .innerJoin(cmsEntries, eq(cmsPublications.entryId, cmsEntries.id))
    .innerJoin(cmsRevisions, eq(cmsPublications.revisionId, cmsRevisions.id))
    .where(
      and(
        eq(cmsEntries.kind, opts.kind),
        inArray(cmsPublications.locale, [locale, fallbackLocale]),
        isNull(cmsPublications.unpublishedAt),
        eq(cmsEntries.status, "published"),
      ),
    )
    .orderBy(desc(cmsPublications.publishedAt))

  const bySlug = new Map<string, PublishedCmsItem>()
  for (const row of rows) {
    const item = toItem(row)
    const existing = bySlug.get(item.slug)
    if (
      !existing ||
      (item.locale === locale &&
        (item.structuredContent !== null ||
          existing.structuredContent === null)) ||
      (existing.structuredContent === null &&
        item.structuredContent !== null)
    ) {
      bySlug.set(item.slug, item)
    }
  }
  return [...bySlug.values()]
}

export async function getPublishedContent(opts: {
  kind: string
  slug: string
  locale: string
}) {
  const locale = parseLocale(opts.locale)
  const db = getDb()
  const [row] = await db
    .select({
      kind: cmsEntries.kind,
      slug: cmsEntries.slug,
      locale: cmsPublications.locale,
      title: cmsRevisions.title,
      body: cmsRevisions.body,
      structuredContent: cmsRevisions.structuredContent,
      revision: cmsRevisions.revision,
      publishedAt: cmsPublications.publishedAt,
    })
    .from(cmsPublications)
    .innerJoin(cmsEntries, eq(cmsPublications.entryId, cmsEntries.id))
    .innerJoin(cmsRevisions, eq(cmsPublications.revisionId, cmsRevisions.id))
    .where(
      and(
        eq(cmsEntries.kind, opts.kind),
        eq(cmsEntries.slug, opts.slug),
        eq(cmsPublications.locale, locale),
        isNull(cmsPublications.unpublishedAt),
        eq(cmsEntries.status, "published"),
      ),
    )
    .limit(1)

  if (!row || row.structuredContent === null) {
    // EN/FR fallback: prefer a structured translation when the requested
    // locale only has legacy body content.
    const fallbackLocale = locale === "en" ? "fr" : "en"
    const [fallback] = await db
      .select({
        kind: cmsEntries.kind,
        slug: cmsEntries.slug,
        locale: cmsPublications.locale,
        title: cmsRevisions.title,
        body: cmsRevisions.body,
        structuredContent: cmsRevisions.structuredContent,
        revision: cmsRevisions.revision,
        publishedAt: cmsPublications.publishedAt,
      })
      .from(cmsPublications)
      .innerJoin(cmsEntries, eq(cmsPublications.entryId, cmsEntries.id))
      .innerJoin(cmsRevisions, eq(cmsPublications.revisionId, cmsRevisions.id))
      .where(
        and(
          eq(cmsEntries.kind, opts.kind),
          eq(cmsEntries.slug, opts.slug),
          eq(cmsPublications.locale, fallbackLocale),
          isNull(cmsPublications.unpublishedAt),
          eq(cmsEntries.status, "published"),
        ),
      )
      .limit(1)
    if (fallback && fallback.structuredContent !== null) {
      return toItem(fallback)
    }
    if (!row && !fallback) throw notFound("CMS entry not found")
    return toItem(row ?? fallback!)
  }

  return toItem(row)
}

function parseLocale(value: string): AppLocale {
  const parsed = localeSchema.safeParse(value)
  if (!parsed.success) {
    throw validationError("Unsupported locale", { locale: value })
  }
  return parsed.data
}

function toItem(row: {
  kind: string
  slug: string
  locale: string
  title: string
  body: string
  structuredContent: string | null
  revision: number
  publishedAt: Date
}): PublishedCmsItem {
  return {
    kind: row.kind,
    slug: row.slug,
    locale: row.locale === "fr" ? "fr" : "en",
    title: row.title,
    body: row.body,
    structuredContent: row.structuredContent,
    revision: row.revision,
    publishedAt: row.publishedAt.toISOString(),
  }
}
