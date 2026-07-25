import { z } from "zod"
import { moneySchema } from "@/server/contracts/money"

export const searchInputSchema = z.object({
  pickupLocation: z.string().min(1).max(120),
  dropoffLocation: z.string().min(1).max(120).optional(),
  pickupAt: z.string().datetime({ offset: true }),
  returnAt: z.string().datetime({ offset: true }),
  locale: z.enum(["en", "fr"]).default("en"),
  ageBand: z.enum(["21-24", "25-29", "30"]).optional(),
  categoryCode: z.string().max(40).optional(),
})

export const pricingBreakdownSchema = z.object({
  rental: moneySchema,
  mandatoryFees: moneySchema,
  extras: moneySchema,
  discount: moneySchema,
  commissionable: moneySchema,
  commission: moneySchema,
  agencyNet: moneySchema,
  onlineDue: moneySchema,
  deskDue: moneySchema,
  deposit: moneySchema,
})

export const searchOfferSchema = z.object({
  offerId: z.string(),
  agencyId: z.string(),
  agencySlug: z.string(),
  agencyName: z.string(),
  categoryCode: z.string(),
  confirmationMode: z.enum(["instant", "request"]),
  paymentMode: z.enum(["deposit_online", "pay_at_agency"]),
  ratePlanId: z.string(),
  days: z.number().int().positive(),
  vehicle: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number().int().nullable(),
  }),
  pricing: pricingBreakdownSchema,
  sponsored: z.boolean(),
})

export const searchResultSchema = z.object({
  searchId: z.string(),
  query: searchInputSchema,
  expiresAt: z.string().datetime(),
  offers: z.array(searchOfferSchema),
  facets: z.object({
    agencies: z.number().int().nonnegative(),
    offers: z.number().int().nonnegative(),
  }),
})

export const quoteSchema = z.object({
  quoteId: z.string(),
  version: z.number().int().positive(),
  expiresAt: z.string().datetime(),
  pricing: searchOfferSchema.shape.pricing,
  agencyId: z.string(),
  categoryCode: z.string(),
  paymentMode: z.enum(["deposit_online", "pay_at_agency"]),
  confirmationMode: z.enum(["instant", "request"]),
  pickupAt: z.string().datetime(),
  returnAt: z.string().datetime(),
  agencyName: z.string(),
  vehicle: searchOfferSchema.shape.vehicle,
})

export const holdSchema = z.object({
  holdId: z.string(),
  expiresAt: z.string().datetime(),
  vehicleId: z.string().nullable(),
})

export const bookingSchema = z.object({
  bookingId: z.string(),
  reference: z.string(),
  status: z.string(),
  version: z.number().int().positive(),
  agencyId: z.string(),
  paymentMode: z.string(),
  deposit: moneySchema.extend({ status: z.string() }),
  pricing: z.object({
    commissionableMillimes: z.string().regex(/^\d+$/),
    commissionMillimes: z.string().regex(/^\d+$/),
    agencyNetMillimes: z.string().regex(/^\d+$/),
    currency: z.literal("TND"),
  }),
})

export const bookingDetailSchema = z.object({
  bookingId: z.string(),
  reference: z.string(),
  status: z.string(),
  version: z.number().int().positive(),
  agencyId: z.string(),
  agencyName: z.string().nullable().optional(),
  confirmationMode: z.string(),
  paymentMode: z.string(),
  pickupAt: z.string().datetime(),
  returnAt: z.string().datetime(),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  driverName: z.string().nullable(),
  vehicle: searchOfferSchema.shape.vehicle.nullable().optional(),
  deposit: moneySchema.extend({ status: z.string() }).nullable(),
  pricing: z.object({
    commissionableMillimes: z.string().regex(/^\d+$/),
    commissionMillimes: z.string().regex(/^\d+$/),
    agencyNetMillimes: z.string().regex(/^\d+$/),
    depositMillimes: z.string().regex(/^\d+$/),
    currency: z.literal("TND"),
  }).nullable(),
  timeline: z.array(z.object({
    toStatus: z.string(),
    fromStatus: z.string().nullable(),
    occurredAt: z.string().datetime(),
    reasonCode: z.string().nullable(),
  })),
})

export const checkoutContextSchema = z.object({
  quote: quoteSchema.extend({
    status: z.string(),
    expired: z.boolean(),
  }),
  hold: holdSchema.nullable(),
})

export const paymentIntentSchema = z.object({
  intentId: z.string().nullable(),
  status: z.string(),
  amountMillimes: z.string().regex(/^\d+$/),
  currency: z.literal("TND").optional(),
  provider: z.string().optional(),
  clientSecret: z.string().optional(),
  includesDeposit: z.literal(false).optional(),
})

export type SearchInput = z.infer<typeof searchInputSchema>
export type SearchResult = z.infer<typeof searchResultSchema>
export type SearchOffer = z.infer<typeof searchOfferSchema>
export type Quote = z.infer<typeof quoteSchema>
export type Booking = z.infer<typeof bookingSchema>
export type BookingDetail = z.infer<typeof bookingDetailSchema>
