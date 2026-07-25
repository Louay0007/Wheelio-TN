import { z } from "zod"

export const appLocaleSchema = z.enum(["en", "fr"])
export type AppLocaleDto = z.infer<typeof appLocaleSchema>

export const opaqueIdSchema = z.string().min(1)
export const isoDateTimeSchema = z.iso.datetime({ offset: true })
export const millimesSchema = z.string().regex(/^-?\d+$/)

export const moneyDtoSchema = z.object({
  amountMillimes: millimesSchema,
  currency: z.literal("TND"),
})
export type MoneyDto = z.infer<typeof moneyDtoSchema>

export const apiMetaSchema = z.object({
  requestId: z.string().min(1),
  locale: appLocaleSchema.optional(),
})
export type ApiMeta = z.infer<typeof apiMetaSchema>

export const apiPageSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  unreadCount: z.number().int().nonnegative().optional(),
})
export type ApiPage = z.infer<typeof apiPageSchema>

export const apiErrorCodeSchema = z.enum([
  "AUTH_REQUIRED",
  "EMAIL_VERIFICATION_REQUIRED",
  "MFA_REQUIRED",
  "STEP_UP_REQUIRED",
  "FORBIDDEN",
  "TENANT_SCOPE_VIOLATION",
  "IMPERSONATION_READ_ONLY",
  "NOT_FOUND",
  "GONE",
  "VALIDATION_ERROR",
  "UNSUPPORTED_LOCALE",
  "VERSION_CONFLICT",
  "ILLEGAL_STATE_TRANSITION",
  "INVENTORY_CONFLICT",
  "HOLD_EXPIRED",
  "PAYMENT_REQUIRED",
  "PAYMENT_PROVIDER_ERROR",
  "REFUND_LIMIT_EXCEEDED",
  "DUAL_CONTROL_REQUIRED",
  "SELF_APPROVAL_FORBIDDEN",
  "APPROVAL_EXPIRED",
  "IDEMPOTENCY_KEY_REUSED",
  "RATE_LIMITED",
  "UPLOAD_REJECTED",
  "PROVIDER_SIGNATURE_INVALID",
  "TEMPORARY_UNAVAILABLE",
  "INTERNAL_ERROR",
  "INVALID_API_RESPONSE",
])
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string().optional(),
  }),
})

export function apiEnvelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({
    data,
    meta: apiMetaSchema,
  })
}

export function apiCollectionEnvelopeSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    page: apiPageSchema,
    meta: apiMetaSchema,
  })
}
