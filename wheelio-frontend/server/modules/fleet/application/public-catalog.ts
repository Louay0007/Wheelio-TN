import { and, desc, eq, isNull } from "drizzle-orm"
import {
  agencies,
  reviews,
  vehicleCategories,
} from "@/db/schema"
import type { AppLocale } from "@/server/contracts/pagination"
import { moneyDto } from "@/server/contracts/money"
import { getDb } from "@/server/core/database/client"
import { notFound, validationError } from "@/server/core/errors/app-error"
import { localeSchema } from "@/server/contracts/pagination"

function parseLocale(value: string): AppLocale {
  const parsed = localeSchema.safeParse(value)
  if (!parsed.success) {
    throw validationError("Unsupported locale", { locale: value })
  }
  return parsed.data
}

function pickTranslation<T extends { locale: string }>(
  rows: T[],
  locale: AppLocale,
): T | null {
  return (
    rows.find((row) => row.locale === locale) ??
    rows.find((row) => row.locale === "en") ??
    rows.find((row) => row.locale === "fr") ??
    null
  )
}

export async function listPublishedLocations(localeRaw: string) {
  const locale = parseLocale(localeRaw)
  const db = getDb()
  const rows = await db.query.locations.findMany({
    where: (table, { eq: whereEq }) => whereEq(table.status, "published"),
    with: { translations: true },
    orderBy: (table, { asc }) => [asc(table.sortOrder)],
  })
  const data = []
  for (const row of rows) {
    const tr = pickTranslation(row.translations, locale)
    if (!tr) continue
    data.push({
      id: row.id,
      slug: row.slug,
      type: row.type,
      region: row.region,
      searchPickup: row.searchPickup,
      startingFrom: row.startingFromMillimes
        ? moneyDto(BigInt(row.startingFromMillimes))
        : null,
      name: tr.name,
      shortName: tr.shortName,
      blurb: tr.blurb,
      intro: tr.intro,
      pickupTips: tr.pickupTipsJson,
      faqs: tr.faqsJson,
      locale: (tr.locale === "fr" ? "fr" : "en") as AppLocale,
    })
  }
  return data
}

export async function getPublishedLocation(slug: string, localeRaw: string) {
  const locale = parseLocale(localeRaw)
  const db = getDb()
  const row = await db.query.locations.findFirst({
    where: (table, { and: whereAnd, eq: whereEq }) =>
      whereAnd(whereEq(table.slug, slug), whereEq(table.status, "published")),
    with: { translations: true },
  })
  if (!row) throw notFound("Location not found")
  const tr = pickTranslation(row.translations, locale)
  if (!tr) throw notFound("Location translation not found")
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    region: row.region,
    searchPickup: row.searchPickup,
    startingFrom: row.startingFromMillimes
      ? moneyDto(BigInt(row.startingFromMillimes))
      : null,
    name: tr.name,
    shortName: tr.shortName,
    blurb: tr.blurb,
    intro: tr.intro,
    pickupTips: tr.pickupTipsJson,
    faqs: tr.faqsJson,
    locale: (tr.locale === "fr" ? "fr" : "en") as AppLocale,
  }
}

export async function listPublishedCategories(localeRaw: string) {
  const locale = parseLocale(localeRaw)
  const db = getDb()
  const rows = await db.query.vehicleCategories.findMany({
    where: eq(vehicleCategories.active, true),
    with: { translations: true },
    orderBy: (table, { asc }) => [asc(table.sortOrder)],
  })
  const data = []
  for (const row of rows) {
    const tr = pickTranslation(row.translations, locale)
    if (!tr) continue
    data.push({
      id: row.id,
      code: row.code,
      label: tr.label,
      blurb: tr.blurb,
      whoFor: tr.whoFor,
      attributes: row.attributesJson,
      locale: (tr.locale === "fr" ? "fr" : "en") as AppLocale,
    })
  }
  return data
}

export async function getPublishedCategory(code: string, localeRaw: string) {
  const locale = parseLocale(localeRaw)
  const db = getDb()
  const row = await db.query.vehicleCategories.findFirst({
    where: and(
      eq(vehicleCategories.code, code),
      eq(vehicleCategories.active, true),
    ),
    with: { translations: true },
  })
  if (!row) throw notFound("Category not found")
  const tr = pickTranslation(row.translations, locale)
  if (!tr) throw notFound("Category translation not found")
  return {
    id: row.id,
    code: row.code,
    label: tr.label,
    blurb: tr.blurb,
    whoFor: tr.whoFor,
    attributes: row.attributesJson,
    locale: (tr.locale === "fr" ? "fr" : "en") as AppLocale,
  }
}

export async function listPublicAgencies(opts: {
  locale: string
  city?: string
  minRating?: number
}) {
  const locale = parseLocale(opts.locale)
  const db = getDb()
  const rows = await db.query.agencies.findMany({
    where: and(
      eq(agencies.publicVisibility, true),
      eq(agencies.verificationStatus, "live"),
      isNull(agencies.suspendedAt),
    ),
    with: { profiles: true },
  })
  return rows
    .filter((row) => (opts.city ? row.city === opts.city : true))
    .filter((row) =>
      opts.minRating ? row.ratingAverage / 100 >= opts.minRating : true,
    )
    .map((row) => {
      const profile =
        row.profiles.find((p) => p.locale === locale) ??
        row.profiles.find((p) => p.locale === "en") ??
        row.profiles[0]
      return {
        id: row.id,
        slug: row.slug,
        name: profile?.publicName ?? row.tradeName,
        city: row.city,
        logoUrl: row.logoUrl,
        rating: row.ratingAverage / 100,
        reviewCount: row.reviewCount,
        bookingMode: row.bookingMode,
        instantEnabled: row.instantEnabled,
        bio: profile?.bio ?? "",
        pickupDescription: profile?.pickupDescription ?? "",
        locale: (profile?.locale === "fr" ? "fr" : "en") as AppLocale,
      }
    })
}

export async function getPublicAgency(slug: string, localeRaw: string) {
  const locale = parseLocale(localeRaw)
  const db = getDb()
  const row = await db.query.agencies.findFirst({
    where: and(
      eq(agencies.slug, slug),
      eq(agencies.publicVisibility, true),
      eq(agencies.verificationStatus, "live"),
      isNull(agencies.suspendedAt),
    ),
    with: { profiles: true },
  })
  if (!row) throw notFound("Agency not found")

  const agencyReviews = await db.query.reviews.findMany({
    where: and(eq(reviews.agencyId, row.id), eq(reviews.status, "visible")),
    orderBy: [desc(reviews.submittedAt)],
    limit: 10,
  })

  const profile =
    row.profiles.find((p) => p.locale === locale) ??
    row.profiles.find((p) => p.locale === "en") ??
    row.profiles[0]

  return {
    id: row.id,
    slug: row.slug,
    name: profile?.publicName ?? row.tradeName,
    city: row.city,
    logoUrl: row.logoUrl,
    rating: row.ratingAverage / 100,
    reviewCount: row.reviewCount,
    bookingMode: row.bookingMode,
    instantEnabled: row.instantEnabled,
    bio: profile?.bio ?? "",
    pickupDescription: profile?.pickupDescription ?? "",
    locale: (profile?.locale === "fr" ? "fr" : "en") as AppLocale,
    reviews: agencyReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      authorDisplayName: review.authorDisplayName,
      submittedAt: review.submittedAt.toISOString(),
    })),
  }
}

export async function listPublicReviews(opts: {
  locale: string
  agencyId?: string
  locationId?: string
  minRating?: number
}) {
  parseLocale(opts.locale)
  const db = getDb()
  const rows = await db
    .select({
      id: reviews.id,
      agencyId: reviews.agencyId,
      locationId: reviews.locationId,
      rating: reviews.rating,
      body: reviews.body,
      authorDisplayName: reviews.authorDisplayName,
      submittedAt: reviews.submittedAt,
      agencySlug: agencies.slug,
      agencyName: agencies.tradeName,
    })
    .from(reviews)
    .innerJoin(agencies, eq(reviews.agencyId, agencies.id))
    .where(
      and(
        eq(reviews.status, "visible"),
        opts.agencyId ? eq(reviews.agencyId, opts.agencyId) : undefined,
        opts.locationId ? eq(reviews.locationId, opts.locationId) : undefined,
      ),
    )
    .orderBy(desc(reviews.submittedAt))
    .limit(50)

  return rows
    .filter((row) => (opts.minRating ? row.rating >= opts.minRating : true))
    .map((row) => ({
      id: row.id,
      agencyId: row.agencyId,
      agencySlug: row.agencySlug,
      agencyName: row.agencyName,
      locationId: row.locationId,
      rating: row.rating,
      body: row.body,
      authorDisplayName: row.authorDisplayName,
      submittedAt: row.submittedAt.toISOString(),
    }))
}

export async function getPublicBootstrap(localeRaw: string) {
  const locale = parseLocale(localeRaw)
  const [featuredLocations, categories, featuredAgencies] = await Promise.all([
    listPublishedLocations(locale),
    listPublishedCategories(locale),
    listPublicAgencies({ locale }),
  ])
  return {
    locale,
    featuredLocations: featuredLocations.slice(0, 6),
    categories,
    featuredAgencies: featuredAgencies.slice(0, 6),
    featureFlags: {
      apiAuth: true,
      apiCatalog: true,
      apiCheckout: false,
    },
  }
}
