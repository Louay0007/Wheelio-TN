import { z } from "zod"

export const driverDtoSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  ageBand: z.string(),
  dateOfBirth: z.string().nullable(),
  licenseCountry: z.string(),
  licenseNumberMasked: z.string(),
  licenseExpiry: z.string(),
  licenseCategory: z.string(),
  isPrimary: z.boolean(),
  notes: z.string().nullable(),
  version: z.number().int(),
  updatedAt: z.string(),
})

export type DriverDto = z.infer<typeof driverDtoSchema>

export const createDriverSchema = z.object({
  fullName: z.string().min(1).max(120),
  ageBand: z.enum(["21-24", "25-29", "30"]),
  dateOfBirth: z.string().nullable().optional(),
  licenseCountry: z.string().min(2).max(80),
  licenseNumber: z.string().min(4).max(64),
  licenseExpiry: z.string().min(4).max(32),
  licenseCategory: z.string().min(1).max(8).default("B"),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export const updateDriverSchema = createDriverSchema
  .partial()
  .extend({
    version: z.number().int().positive(),
    licenseNumber: z.string().min(4).max(64).optional(),
  })

export type CreateDriverInput = z.infer<typeof createDriverSchema>
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>
