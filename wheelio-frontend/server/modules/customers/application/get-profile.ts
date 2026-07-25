import { and, eq } from "drizzle-orm"
import { customerProfiles } from "@/db/schema"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { forbidden, notFound } from "@/server/core/errors/app-error"
import {
  ensureProfile,
  findProfileByUserId,
  toProfileDto,
} from "@/server/modules/customers/infrastructure/customer-repository"

export async function getProfile(principal: EffectivePrincipal) {
  if (principal.impersonating) {
    // Stage 0: impersonation not enabled; keep guardrail.
  }
  const db = getDb()
  let profile = await findProfileByUserId(db, principal.effectiveUserId)
  if (!profile) {
    profile = await ensureProfile(db, {
      userId: principal.effectiveUserId,
      legalName: principal.name || principal.email,
      preferredLocale: "en",
    })
  }
  if (profile.userId !== principal.effectiveUserId) {
    throw forbidden("TENANT_SCOPE_VIOLATION", "Profile belongs to another user")
  }
  return toProfileDto(profile)
}

export async function getProfileOrThrow(principal: EffectivePrincipal) {
  const db = getDb()
  const profile = await db.query.customerProfiles.findFirst({
    where: and(
      eq(customerProfiles.userId, principal.effectiveUserId),
      eq(customerProfiles.id, principal.customerProfileId ?? ""),
    ),
  })
  if (!profile) {
    // Fall back to userId lookup for freshly created accounts.
    return getProfile(principal)
  }
  return toProfileDto(profile)
}
