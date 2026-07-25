import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { savedOffers, savedSearches } from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import {
  forbidden,
  notFound,
  validationError,
} from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import {
  ensureProfile,
  findProfileByUserId,
} from "@/server/modules/customers/infrastructure/customer-repository"

async function requireProfile(principal: EffectivePrincipal) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation sessions cannot mutate saved items",
    )
  }
  const db = getDb()
  let profile = await findProfileByUserId(db, principal.effectiveUserId)
  if (!profile) {
    profile = await ensureProfile(db, {
      userId: principal.effectiveUserId,
      legalName: principal.name || principal.email,
    })
  }
  if (profile.userId !== principal.effectiveUserId) {
    throw forbidden("TENANT_SCOPE_VIOLATION", "Saved items profile mismatch")
  }
  return profile
}

export async function listSavedSearches(principal: EffectivePrincipal) {
  const profile = await requireProfile(principal)
  const rows = await getDb().query.savedSearches.findMany({
    where: eq(savedSearches.customerProfileId, profile.id),
  })
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    querySnapshot: row.querySnapshot,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function createSavedSearch(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    label: z.string().max(120).nullable().optional(),
    querySnapshot: z.record(z.string(), z.unknown()),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid saved search", { issues: parsed.error.issues })
  }
  const profile = await requireProfile(principal)
  return withTransaction(getDb(), async (tx) => {
    const id = createId("ssrch")
    const [row] = await tx
      .insert(savedSearches)
      .values({
        id,
        customerProfileId: profile.id,
        label: parsed.data.label ?? null,
        querySnapshot: parsed.data.querySnapshot,
      })
      .returning()
    await recordAudit(
      tx,
      {
        action: "customer.saved_search.created",
        resourceType: "saved_search",
        resourceId: id,
        tenantType: "customer",
        tenantId: profile.id,
      },
      ctx,
      principal,
    )
    return {
      id: row!.id,
      label: row!.label,
      querySnapshot: row!.querySnapshot,
      createdAt: row!.createdAt.toISOString(),
    }
  })
}

export async function deleteSavedSearch(
  principal: EffectivePrincipal,
  id: string,
  ctx: RequestContext,
) {
  const profile = await requireProfile(principal)
  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.savedSearches.findFirst({
      where: and(
        eq(savedSearches.id, id),
        eq(savedSearches.customerProfileId, profile.id),
      ),
    })
    if (!existing) throw notFound("Saved search not found")
    await tx.delete(savedSearches).where(eq(savedSearches.id, id))
    await recordAudit(
      tx,
      {
        action: "customer.saved_search.deleted",
        resourceType: "saved_search",
        resourceId: id,
        tenantType: "customer",
        tenantId: profile.id,
      },
      ctx,
      principal,
    )
    return { deleted: true as const }
  })
}

export async function listSavedOffers(principal: EffectivePrincipal) {
  const profile = await requireProfile(principal)
  const rows = await getDb().query.savedOffers.findMany({
    where: eq(savedOffers.customerProfileId, profile.id),
  })
  return rows.map((row) => ({
    id: row.id,
    offerId: row.offerId,
    offerSnapshot: row.offerSnapshot,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function createSavedOffer(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    offerId: z.string().min(1).max(120),
    offerSnapshot: z.record(z.string(), z.unknown()).default({}),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid saved offer", { issues: parsed.error.issues })
  }
  const profile = await requireProfile(principal)
  return withTransaction(getDb(), async (tx) => {
    const id = createId("soff")
    const [row] = await tx
      .insert(savedOffers)
      .values({
        id,
        customerProfileId: profile.id,
        offerId: parsed.data.offerId,
        offerSnapshot: parsed.data.offerSnapshot,
      })
      .returning()
    await recordAudit(
      tx,
      {
        action: "customer.saved_offer.created",
        resourceType: "saved_offer",
        resourceId: id,
        tenantType: "customer",
        tenantId: profile.id,
      },
      ctx,
      principal,
    )
    return {
      id: row!.id,
      offerId: row!.offerId,
      offerSnapshot: row!.offerSnapshot,
      createdAt: row!.createdAt.toISOString(),
    }
  })
}

export async function deleteSavedOffer(
  principal: EffectivePrincipal,
  id: string,
  ctx: RequestContext,
) {
  const profile = await requireProfile(principal)
  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.savedOffers.findFirst({
      where: and(
        eq(savedOffers.id, id),
        eq(savedOffers.customerProfileId, profile.id),
      ),
    })
    if (!existing) throw notFound("Saved offer not found")
    await tx.delete(savedOffers).where(eq(savedOffers.id, id))
    await recordAudit(
      tx,
      {
        action: "customer.saved_offer.deleted",
        resourceType: "saved_offer",
        resourceId: id,
        tenantType: "customer",
        tenantId: profile.id,
      },
      ctx,
      principal,
    )
    return { deleted: true as const }
  })
}
