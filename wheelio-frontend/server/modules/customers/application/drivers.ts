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
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import {
  createDriverSchema,
  updateDriverSchema,
} from "@/server/modules/customers/contracts/driver"
import {
  clearPrimaryDrivers,
  createDriverRow,
  findDriver,
  listDrivers,
  softDeleteDriver,
  toDriverDto,
  updateDriverRow,
} from "@/server/modules/customers/infrastructure/driver-repository"
import {
  ensureProfile,
  findProfileByUserId,
} from "@/server/modules/customers/infrastructure/customer-repository"

async function requireOwnProfile(principal: EffectivePrincipal) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation sessions cannot mutate drivers",
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
    throw forbidden("TENANT_SCOPE_VIOLATION", "Driver profile mismatch")
  }
  return profile
}

export async function listCustomerDrivers(principal: EffectivePrincipal) {
  const profile = await requireOwnProfile(principal)
  const rows = await listDrivers(getDb(), profile.id)
  return rows.map((row) => toDriverDto(row))
}

export async function getCustomerDriver(
  principal: EffectivePrincipal,
  driverId: string,
) {
  const profile = await requireOwnProfile(principal)
  const row = await findDriver(getDb(), profile.id, driverId)
  if (!row) throw notFound("Driver not found")
  return toDriverDto(row)
}

export async function createCustomerDriver(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const profile = await requireOwnProfile(principal)
  const parsed = createDriverSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid driver payload", {
      issues: parsed.error.issues,
    })
  }
  const input = parsed.data
  if (new Date(input.licenseExpiry) <= new Date()) {
    throw validationError("Licence expiry must be in the future")
  }

  return withTransaction(getDb(), async (tx) => {
    if (input.isPrimary) {
      await clearPrimaryDrivers(tx, profile.id)
    }
    const existing = await listDrivers(tx, profile.id)
    const makePrimary = input.isPrimary || existing.length === 0
    if (makePrimary && !input.isPrimary) {
      await clearPrimaryDrivers(tx, profile.id)
    }
    const created = await createDriverRow(tx, {
      profileId: profile.id,
      ...input,
      isPrimary: makePrimary,
    })
    const dto = toDriverDto(created)
    await recordAudit(
      tx,
      {
        action: "customer.driver.created",
        resourceType: "customer_driver",
        resourceId: created.id,
        tenantType: "customer",
        tenantId: profile.id,
        after: dto,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "customer_driver",
      aggregateId: created.id,
      eventType: "customer.driver.created",
      payload: { driverId: created.id, profileId: profile.id },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return dto
  })
}

export async function updateCustomerDriver(
  principal: EffectivePrincipal,
  driverId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const profile = await requireOwnProfile(principal)
  const parsed = updateDriverSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid driver payload", {
      issues: parsed.error.issues,
    })
  }
  const input = parsed.data

  return withTransaction(getDb(), async (tx) => {
    const existing = await findDriver(tx, profile.id, driverId)
    if (!existing) throw notFound("Driver not found")
    if (existing.version !== input.version) {
      throw conflict(
        "VERSION_CONFLICT",
        "Driver was updated elsewhere; refresh and retry",
        { expected: input.version, actual: existing.version },
      )
    }
    if (input.isPrimary) {
      await clearPrimaryDrivers(tx, profile.id)
    }
    const updated = await updateDriverRow(tx, driverId, input)
    if (!updated) throw notFound("Driver not found after update")
    const dto = toDriverDto(updated)
    await recordAudit(
      tx,
      {
        action: "customer.driver.updated",
        resourceType: "customer_driver",
        resourceId: driverId,
        tenantType: "customer",
        tenantId: profile.id,
        before: toDriverDto(existing),
        after: dto,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "customer_driver",
      aggregateId: driverId,
      eventType: "customer.driver.updated",
      payload: { driverId, profileId: profile.id, version: dto.version },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return dto
  })
}

export async function deleteCustomerDriver(
  principal: EffectivePrincipal,
  driverId: string,
  expectedVersion: number,
  ctx: RequestContext,
) {
  const profile = await requireOwnProfile(principal)
  return withTransaction(getDb(), async (tx) => {
    const existing = await findDriver(tx, profile.id, driverId)
    if (!existing) throw notFound("Driver not found")
    if (existing.version !== expectedVersion) {
      throw conflict(
        "VERSION_CONFLICT",
        "Driver was updated elsewhere; refresh and retry",
        { expected: expectedVersion, actual: existing.version },
      )
    }
    await softDeleteDriver(tx, driverId, existing.version)
    const remaining = await listDrivers(tx, profile.id)
    if (remaining.length && !remaining.some((d) => d.isPrimary)) {
      await updateDriverRow(tx, remaining[0]!.id, {
        isPrimary: true,
        version: remaining[0]!.version,
      })
    }
    await recordAudit(
      tx,
      {
        action: "customer.driver.deleted",
        resourceType: "customer_driver",
        resourceId: driverId,
        tenantType: "customer",
        tenantId: profile.id,
        before: toDriverDto(existing),
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "customer_driver",
      aggregateId: driverId,
      eventType: "customer.driver.deleted",
      payload: { driverId, profileId: profile.id },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return { deleted: true as const }
  })
}
