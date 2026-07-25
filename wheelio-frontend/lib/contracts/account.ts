import { z } from "zod"
import {
  appLocaleSchema,
  isoDateTimeSchema,
  opaqueIdSchema,
} from "@/lib/contracts/common"

export const themePreferenceSchema = z.enum(["system", "light", "dark"])
export const ageBandSchema = z.enum(["21-24", "25-29", "30"])

export const customerProfileSchema = z.object({
  id: opaqueIdSchema,
  userId: opaqueIdSchema,
  legalName: z.string(),
  preferredName: z.string().nullable(),
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  nationality: z.string().nullable(),
  residenceCountry: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  preferredLocale: appLocaleSchema,
  theme: themePreferenceSchema,
  usualPickup: z.string().nullable(),
  defaultAgeBand: z.string().nullable(),
  marketingOptIn: z.boolean(),
  welcomeCompleted: z.boolean(),
  extrasInterests: z.array(z.string()),
  version: z.number().int().positive(),
  updatedAt: isoDateTimeSchema,
})
export type CustomerProfile = z.infer<typeof customerProfileSchema>

export const updateCustomerProfileInputSchema = customerProfileSchema
  .pick({
    legalName: true,
    preferredName: true,
    phone: true,
    dateOfBirth: true,
    nationality: true,
    residenceCountry: true,
    addressLine: true,
    city: true,
    preferredLocale: true,
    theme: true,
    usualPickup: true,
    defaultAgeBand: true,
    marketingOptIn: true,
    welcomeCompleted: true,
    extrasInterests: true,
    version: true,
  })
  .partial()
  .required({ version: true })
export type UpdateCustomerProfileInput = z.infer<
  typeof updateCustomerProfileInputSchema
>

export const meSchema = z.object({
  user: z.object({
    id: opaqueIdSchema,
    email: z.email(),
    emailVerified: z.boolean(),
    name: z.string(),
  }),
  actorClass: z.string(),
  roles: z.array(z.string()),
  tenantType: z.string().nullable(),
  tenantId: z.string().nullable(),
  customerProfileId: z.string(),
  agencyMemberships: z.array(z.unknown()),
  adminMembership: z.unknown().nullable(),
  impersonating: z.boolean(),
  profile: customerProfileSchema,
})
export type Me = z.infer<typeof meSchema>

export const accountPreferencesSchema = customerProfileSchema.pick({
  preferredLocale: true,
  theme: true,
  usualPickup: true,
  defaultAgeBand: true,
  extrasInterests: true,
  marketingOptIn: true,
  version: true,
})
export type AccountPreferences = z.infer<typeof accountPreferencesSchema>

export const driverSchema = z.object({
  id: opaqueIdSchema,
  fullName: z.string(),
  ageBand: z.string(),
  dateOfBirth: z.string().nullable(),
  licenseCountry: z.string(),
  licenseNumberMasked: z.string(),
  licenseExpiry: z.string(),
  licenseCategory: z.string(),
  isPrimary: z.boolean(),
  notes: z.string().nullable(),
  version: z.number().int().positive(),
  updatedAt: isoDateTimeSchema,
})
export type Driver = z.infer<typeof driverSchema>

export const createDriverInputSchema = z.object({
  fullName: z.string().min(1).max(120),
  ageBand: ageBandSchema,
  dateOfBirth: z.string().nullable().optional(),
  licenseCountry: z.string().min(2).max(80),
  licenseNumber: z.string().min(4).max(64),
  licenseExpiry: z.string().min(4).max(32),
  licenseCategory: z.string().min(1).max(8).default("B"),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
})
export type CreateDriverInput = z.infer<typeof createDriverInputSchema>

export const updateDriverInputSchema = createDriverInputSchema
  .partial()
  .extend({
    version: z.number().int().positive(),
    licenseNumber: z.string().min(4).max(64).optional(),
  })
export type UpdateDriverInput = z.infer<typeof updateDriverInputSchema>

export const sessionSchema = z.object({
  id: opaqueIdSchema,
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  current: z.boolean(),
})
export type AccountSession = z.infer<typeof sessionSchema>

export const securityOverviewSchema = z.object({
  mfa: z.object({
    enabled: z.boolean(),
    lockedUntil: isoDateTimeSchema.nullable(),
  }),
  events: z.array(
    z.object({
      id: opaqueIdSchema,
      action: z.string(),
      occurredAt: isoDateTimeSchema,
      ipAddress: z.string().nullable(),
      userAgent: z.string().nullable(),
    }),
  ),
})
export type SecurityOverview = z.infer<typeof securityOverviewSchema>

export const notificationPreferencesSchema = z.object({
  preferences: z.record(
    z.string(),
    z.object({ email: z.boolean(), sms: z.boolean() }),
  ),
  version: z.number().int().positive(),
})
export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>

export const customerNotificationSchema = z.object({
  id: opaqueIdSchema,
  type: z.string(),
  title: z.string(),
  body: z.string(),
  href: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  readAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
})
export type CustomerNotification = z.infer<typeof customerNotificationSchema>

export const notificationReadAckSchema = z.object({
  id: opaqueIdSchema,
  readAt: isoDateTimeSchema.nullable(),
})

export const savedSearchSchema = z.object({
  id: opaqueIdSchema,
  label: z.string().nullable(),
  querySnapshot: z.record(z.string(), z.unknown()),
  createdAt: isoDateTimeSchema,
})
export type SavedSearch = z.infer<typeof savedSearchSchema>

export const savedOfferSchema = z.object({
  id: opaqueIdSchema,
  offerId: z.string(),
  offerSnapshot: z.record(z.string(), z.unknown()),
  createdAt: isoDateTimeSchema,
})
export type SavedOffer = z.infer<typeof savedOfferSchema>

export const privacyRequestSchema = z.object({
  id: opaqueIdSchema,
  requestType: z.enum(["export", "deletion"]),
  status: z.string(),
  dueAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.nullable().optional(),
  artifactReady: z.boolean().optional(),
  artifactExpiresAt: isoDateTimeSchema.nullable().optional(),
  legalHoldReason: z.string().nullable().optional(),
  retentionUntil: isoDateTimeSchema.nullable().optional(),
  failureReason: z.string().nullable().optional(),
})
export type PrivacyRequest = z.infer<typeof privacyRequestSchema>

export const mutationAckSchema = z.record(z.string(), z.unknown())

export const bookingClaimRequestAckSchema = z.object({ accepted: z.literal(true) })
export const bookingClaimResultSchema = z.object({
  bookingId: opaqueIdSchema,
  reference: z.string(),
  version: z.number().int().positive(),
  attached: z.literal(true),
})
export type BookingClaimResult = z.infer<typeof bookingClaimResultSchema>
