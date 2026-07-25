import type { EffectivePrincipal } from "@/server/core/auth/principal"
import type { RequestContext } from "@/server/core/http/request-context"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import {
  conflict,
  forbidden,
  notFound,
  validationError,
} from "@/server/core/errors/app-error"
import { localeSchema } from "@/server/contracts/pagination"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import {
  updateCustomerProfileSchema,
  type UpdateCustomerProfileInput,
} from "@/server/modules/customers/contracts/profile"
import {
  ensureProfile,
  findProfileByUserId,
  toProfileDto,
  updateProfileRow,
} from "@/server/modules/customers/infrastructure/customer-repository"

export async function updateProfile(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation sessions cannot mutate profiles",
    )
  }

  const parsed = updateCustomerProfileSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid profile payload", {
      issues: parsed.error.issues,
    })
  }
  const input = parsed.data
  if (input.preferredLocale) {
    const locale = localeSchema.safeParse(input.preferredLocale)
    if (!locale.success) {
      throw validationError("Unsupported locale", { locale: input.preferredLocale })
    }
  }

  const db = getDb()
  return withTransaction(db, async (tx) => {
    let profile = await findProfileByUserId(tx, principal.effectiveUserId)
    if (!profile) {
      profile = await ensureProfile(tx, {
        userId: principal.effectiveUserId,
        legalName: input.legalName ?? principal.name ?? principal.email,
        preferredLocale: input.preferredLocale,
      })
    }

    if (profile.userId !== principal.effectiveUserId) {
      throw forbidden(
        "TENANT_SCOPE_VIOLATION",
        "Cannot update another customer's profile",
      )
    }

    if (profile.version !== input.version) {
      throw conflict(
        "VERSION_CONFLICT",
        "Profile was updated elsewhere; refresh and retry",
        { expected: input.version, actual: profile.version },
      )
    }

    const before = toProfileDto(profile)
    const updated = await updateProfileRow(tx, profile.id, input)
    if (!updated) throw notFound("Profile not found after update")
    const after = toProfileDto(updated)

    await recordAudit(
      tx,
      {
        action: "customer.profile.updated",
        resourceType: "customer_profile",
        resourceId: profile.id,
        tenantType: "customer",
        tenantId: profile.id,
        before,
        after,
      },
      ctx,
      principal,
    )

    await enqueueOutbox(tx, {
      aggregateType: "customer_profile",
      aggregateId: profile.id,
      eventType: "customer.profile.updated",
      payload: {
        profileId: profile.id,
        userId: principal.effectiveUserId,
        version: after.version,
      },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return after
  })
}

export type { UpdateCustomerProfileInput }
