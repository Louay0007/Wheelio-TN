import { z } from "zod"
import { localeSchema } from "@/server/contracts/pagination"

export const customerProfileDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  legalName: z.string(),
  preferredName: z.string().nullable(),
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  nationality: z.string().nullable(),
  residenceCountry: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  preferredLocale: localeSchema,
  theme: z.enum(["system", "light", "dark"]),
  usualPickup: z.string().nullable(),
  defaultAgeBand: z.string().nullable(),
  marketingOptIn: z.boolean(),
  welcomeCompleted: z.boolean(),
  extrasInterests: z.array(z.string()),
  version: z.number().int(),
  updatedAt: z.string(),
})

export type CustomerProfileDto = z.infer<typeof customerProfileDtoSchema>

export const updateCustomerProfileSchema = z.object({
  legalName: z.string().min(1).max(120).optional(),
  preferredName: z.string().max(80).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  nationality: z.string().max(80).nullable().optional(),
  residenceCountry: z.string().max(80).nullable().optional(),
  addressLine: z.string().max(200).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  preferredLocale: localeSchema.optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
  usualPickup: z.string().max(120).nullable().optional(),
  defaultAgeBand: z.string().max(40).nullable().optional(),
  marketingOptIn: z.boolean().optional(),
  welcomeCompleted: z.boolean().optional(),
  extrasInterests: z.array(z.string().max(40)).max(20).optional(),
  version: z.number().int().positive(),
})

export type UpdateCustomerProfileInput = z.infer<
  typeof updateCustomerProfileSchema
>
