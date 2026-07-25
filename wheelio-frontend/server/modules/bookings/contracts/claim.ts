import { z } from "zod"

export const requestBookingClaimSchema = z.object({
  reference: z.string().trim().min(4).max(64),
  email: z.email().transform((value) => value.trim().toLowerCase()),
})
export const confirmBookingClaimSchema = z.object({ token: z.string().min(32).max(512) })
export const bookingClaimRequestAckSchema = z.object({ accepted: z.literal(true) })
export const bookingClaimResultSchema = z.object({
  bookingId: z.string(), reference: z.string(), version: z.number().int().positive(), attached: z.literal(true),
})
