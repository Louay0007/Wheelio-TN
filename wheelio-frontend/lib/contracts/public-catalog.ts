import { z } from "zod"
import {
  appLocaleSchema,
  isoDateTimeSchema,
  moneyDtoSchema,
  opaqueIdSchema,
} from "@/lib/contracts/common"

const nullableTextSchema = z.string().nullable()

export const publicLocationSchema = z.object({
  id: opaqueIdSchema,
  slug: z.string().min(1),
  type: z.enum(["airport", "city"]),
  region: z.string().min(1),
  searchPickup: z.string().min(1),
  startingFrom: moneyDtoSchema.nullable(),
  name: z.string().min(1),
  shortName: z.string().min(1),
  blurb: z.string(),
  intro: z.string(),
  pickupTips: z.array(z.string()),
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
  locale: appLocaleSchema,
})
export type PublicLocation = z.infer<typeof publicLocationSchema>

export const publicCategorySchema = z.object({
  id: opaqueIdSchema,
  code: z.string().min(1),
  label: z.string().min(1),
  blurb: z.string(),
  whoFor: z.string(),
  attributes: z.record(z.string(), z.unknown()),
  locale: appLocaleSchema,
})
export type PublicCategory = z.infer<typeof publicCategorySchema>

export const publicReviewSchema = z.object({
  id: opaqueIdSchema,
  agencyId: opaqueIdSchema,
  agencySlug: z.string().min(1),
  agencyName: z.string().min(1),
  locationId: opaqueIdSchema.nullable(),
  rating: z.number().int().min(1).max(5),
  body: z.string(),
  authorDisplayName: z.string(),
  submittedAt: isoDateTimeSchema,
})
export type PublicReview = z.infer<typeof publicReviewSchema>

export const agencyReviewSchema = z.object({
  id: opaqueIdSchema,
  rating: z.number().int().min(1).max(5),
  body: z.string(),
  authorDisplayName: z.string(),
  submittedAt: isoDateTimeSchema,
})

export const publicAgencySchema = z.object({
  id: opaqueIdSchema,
  slug: z.string().min(1),
  name: z.string().min(1),
  city: z.string().min(1),
  logoUrl: nullableTextSchema,
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  bookingMode: z.string().min(1),
  instantEnabled: z.boolean(),
  bio: z.string(),
  pickupDescription: z.string(),
  locale: appLocaleSchema,
})
export type PublicAgency = z.infer<typeof publicAgencySchema>

export const publicAgencyDetailSchema = publicAgencySchema.extend({
  reviews: z.array(agencyReviewSchema),
})
export type PublicAgencyDetail = z.infer<typeof publicAgencyDetailSchema>

export const publicBootstrapSchema = z.object({
  locale: appLocaleSchema,
  featuredLocations: z.array(publicLocationSchema),
  categories: z.array(publicCategorySchema),
  featuredAgencies: z.array(publicAgencySchema),
  featureFlags: z.record(z.string(), z.boolean()),
})
export type PublicBootstrap = z.infer<typeof publicBootstrapSchema>

export const cmsContentSchema = z.object({
  kind: z.string().min(1),
  slug: z.string().min(1),
  locale: appLocaleSchema,
  title: z.string(),
  body: z.string(),
  structuredContent: z.string().nullable(),
  revision: z.number().int().positive(),
  publishedAt: isoDateTimeSchema,
})
export type CmsContent = z.infer<typeof cmsContentSchema>
