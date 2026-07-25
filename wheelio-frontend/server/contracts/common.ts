import { z } from "zod"
import { localeSchema } from "./pagination"

export const errorCodeSchema = z.enum([
  "AUTH_REQUIRED",
  "BOOKING_ACCESS_REQUIRED",
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
])

export type ErrorCode = z.infer<typeof errorCodeSchema>

export const successMetaSchema = z.object({
  requestId: z.string(),
  locale: localeSchema.optional(),
})

export type SuccessMeta = z.infer<typeof successMetaSchema>
