import { and, eq } from "drizzle-orm"
import { z } from "zod"
import {
  agencies,
  agencyOnboardingSteps,
  bookingStatusHistory,
  bookings,
  branches,
  depositMemos,
  handoverRecords,
  ratePlans,
  returnRecords,
  vehicles,
} from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import {
  conflict,
  forbidden,
  notFound,
  validationError,
} from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"

const ROLE_MATRIX = {
  owner: [
    "dashboard",
    "bookings",
    "accept",
    "handover",
    "return",
    "fleet",
    "rates",
    "branches",
    "onboarding",
    "finance",
    "team",
    "policies",
    "notifications",
    "messages",
    "settings",
    "reports",
    "calendar",
    "reviews",
  ],
  manager: [
    "dashboard",
    "bookings",
    "accept",
    "handover",
    "return",
    "fleet",
    "rates",
    "branches",
    "onboarding",
    "finance",
    "team",
    "policies",
    "notifications",
    "messages",
    "settings",
    "reports",
    "calendar",
    "reviews",
  ],
  agent: [
    "dashboard",
    "bookings",
    "accept",
    "handover",
    "return",
    "notifications",
    "messages",
    "calendar",
  ],
  fleet: ["dashboard", "bookings", "fleet", "notifications", "calendar"],
  accountant: ["dashboard", "bookings", "finance", "notifications", "reports"],
} as const

export type AgencyPermission = (typeof ROLE_MATRIX)[keyof typeof ROLE_MATRIX][number]

export function agencyRoleAllows(
  role: string,
  permission: AgencyPermission,
): boolean {
  const perms = ROLE_MATRIX[role as keyof typeof ROLE_MATRIX]
  return Boolean(perms?.includes(permission as never))
}

export function requireAgencyContext(
  principal: EffectivePrincipal,
  permission: AgencyPermission,
) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot mutate agency resources",
    )
  }
  if (principal.actorClass === "admin") {
    return {
      agencyId: principal.tenantId ?? principal.agencyMemberships[0]?.agencyId,
      role: principal.adminMembership?.role ?? "super",
    }
  }
  const membership = principal.agencyMemberships[0]
  if (!membership) throw forbidden("FORBIDDEN", "Agency membership required")
  if (!agencyRoleAllows(membership.role, permission)) {
    throw forbidden("FORBIDDEN", `Role ${membership.role} cannot ${permission}`)
  }
  return { agencyId: membership.agencyId, role: membership.role }
}

/** Read-only agency context (allows impersonation). */
export function requireAgencyReadContext(
  principal: EffectivePrincipal,
  permission: AgencyPermission,
) {
  if (principal.actorClass === "admin") {
    return {
      agencyId: principal.tenantId ?? principal.agencyMemberships[0]?.agencyId,
      role: principal.adminMembership?.role ?? "super",
    }
  }
  const membership = principal.agencyMemberships[0]
  if (!membership) throw forbidden("FORBIDDEN", "Agency membership required")
  if (!agencyRoleAllows(membership.role, permission)) {
    throw forbidden("FORBIDDEN", `Role ${membership.role} cannot ${permission}`)
  }
  return { agencyId: membership.agencyId, role: membership.role }
}

export async function getOnboarding(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyContext(principal, "onboarding")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const steps = await getDb().query.agencyOnboardingSteps.findMany({
    where: eq(agencyOnboardingSteps.agencyId, agencyId),
  })
  const agency = await getDb().query.agencies.findFirst({
    where: eq(agencies.id, agencyId),
  })
  return {
    agencyId,
    verificationStatus: agency?.verificationStatus ?? "draft",
    steps: steps.map((s) => ({
      step: s.step,
      completed: Boolean(s.completedAt),
      version: s.version,
      payload: s.payloadJson,
    })),
  }
}

export async function putOnboardingStep(
  principal: EffectivePrincipal,
  step: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const allowed = [
    "profile",
    "branch",
    "fleet",
    "rates",
    "policies",
    "booking-mode",
  ] as const
  if (!allowed.includes(step as (typeof allowed)[number])) {
    throw validationError("Unknown onboarding step", { step })
  }
  const schema = z.object({
    payload: z.record(z.string(), z.unknown()),
    expectedVersion: z.number().int().positive().optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid onboarding payload", {
      issues: parsed.error.issues,
    })
  }
  const { agencyId } = requireAgencyContext(principal, "onboarding")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.agencyOnboardingSteps.findFirst({
      where: and(
        eq(agencyOnboardingSteps.agencyId, agencyId),
        eq(agencyOnboardingSteps.step, step),
      ),
    })
    if (
      existing &&
      parsed.data.expectedVersion &&
      existing.version !== parsed.data.expectedVersion
    ) {
      throw conflict("VERSION_CONFLICT", "Onboarding step version mismatch")
    }
    if (existing) {
      await tx
        .update(agencyOnboardingSteps)
        .set({
          payloadJson: parsed.data.payload,
          completedAt: new Date(),
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(agencyOnboardingSteps.id, existing.id))
    } else {
      await tx.insert(agencyOnboardingSteps).values({
        id: createId("aonb"),
        agencyId,
        step,
        payloadJson: parsed.data.payload,
        completedAt: new Date(),
      })
    }
    await recordAudit(
      tx,
      {
        action: "agency.onboarding_step_completed",
        resourceType: "agency",
        resourceId: agencyId,
        tenantType: "agency",
        tenantId: agencyId,
        after: { step },
      },
      ctx,
      principal,
    )
    return getOnboarding(principal)
  })
}

export async function listBranches(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyContext(principal, "branches")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.branches.findMany({
    where: eq(branches.agencyId, agencyId),
  })
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    active: row.active,
    publicVisible: row.publicVisible,
    version: row.version,
  }))
}

export async function createBranch(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    name: z.string().min(1).max(120),
    city: z.string().min(1).max(80),
    addressLine: z.string().max(200).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(40).optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid branch", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "branches")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const id = createId("brn")
    await tx.insert(branches).values({
      id,
      agencyId,
      name: parsed.data.name,
      city: parsed.data.city,
      addressLine: parsed.data.addressLine,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
    })
    await recordAudit(
      tx,
      {
        action: "branch.created",
        resourceType: "branch",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return { id, ...parsed.data, version: 1 }
  })
}

export async function listFleet(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.vehicles.findMany({
    where: eq(vehicles.agencyId, agencyId),
  })
  return rows.map((row) => ({
    id: row.id,
    categoryCode: row.categoryCode,
    make: row.make,
    model: row.model,
    year: row.year,
    status: row.status,
    branchId: row.branchId,
    version: row.version,
  }))
}

export async function getFleetVehicle(
  principal: EffectivePrincipal,
  vehicleId: string,
) {
  const { agencyId } = requireAgencyContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const row = await getDb().query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.agencyId, agencyId)),
  })
  if (!row) throw notFound("Vehicle not found")
  return {
    id: row.id,
    categoryCode: row.categoryCode,
    make: row.make,
    model: row.model,
    year: row.year,
    status: row.status,
    branchId: row.branchId,
    visibility: row.visibility,
    active: row.active,
    version: row.version,
  }
}

export async function updateFleetVehicle(
  principal: EffectivePrincipal,
  vehicleId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    expectedVersion: z.number().int().positive(),
    make: z.string().min(1).max(80).optional(),
    model: z.string().min(1).max(80).optional(),
    status: z.enum(["ready", "on_rent", "maintenance", "hidden"]).optional(),
    year: z.number().int().min(1990).max(2100).optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid vehicle update", {
      issues: parsed.error.issues,
    })
  }
  const { agencyId } = requireAgencyContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const row = await tx.query.vehicles.findFirst({
      where: and(eq(vehicles.id, vehicleId), eq(vehicles.agencyId, agencyId)),
    })
    if (!row) throw notFound("Vehicle not found")
    if (row.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Vehicle version mismatch")
    }
    await tx
      .update(vehicles)
      .set({
        make: parsed.data.make ?? row.make,
        model: parsed.data.model ?? row.model,
        status: parsed.data.status ?? row.status,
        year: parsed.data.year ?? row.year,
        version: row.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, vehicleId))
    await recordAudit(
      tx,
      {
        action: "vehicle.updated",
        resourceType: "vehicle",
        resourceId: vehicleId,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return {
      id: vehicleId,
      version: row.version + 1,
      status: parsed.data.status ?? row.status,
    }
  })
}

export async function listRates(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyContext(principal, "rates")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.ratePlans.findMany({
    where: eq(ratePlans.agencyId, agencyId),
  })
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    categoryCode: row.categoryCode,
    netDailyMillimes: row.netDailyMillimes.toString(),
    active: row.active,
    version: row.version,
  }))
}

export async function getRatePlan(
  principal: EffectivePrincipal,
  planId: string,
) {
  const { agencyId } = requireAgencyContext(principal, "rates")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const row = await getDb().query.ratePlans.findFirst({
    where: and(eq(ratePlans.id, planId), eq(ratePlans.agencyId, agencyId)),
  })
  if (!row) throw notFound("Rate plan not found")
  return {
    id: row.id,
    name: row.name,
    categoryCode: row.categoryCode,
    netDailyMillimes: row.netDailyMillimes.toString(),
    minimumDays: row.minimumDays,
    active: row.active,
    version: row.version,
  }
}

export async function createFleetVehicle(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    categoryCode: z.string().min(1).max(40),
    make: z.string().min(1).max(80),
    model: z.string().min(1).max(80),
    year: z.number().int().min(1990).max(2100).optional(),
    plateHint: z.string().min(3).max(40),
    branchId: z.string().optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid vehicle", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const { createHash } = await import("node:crypto")
    const id = createId("veh")
    await tx.insert(vehicles).values({
      id,
      agencyId,
      branchId: parsed.data.branchId,
      categoryCode: parsed.data.categoryCode,
      plateHash: createHash("sha256").update(parsed.data.plateHint).digest("hex"),
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      status: "ready",
      visibility: "public",
      active: true,
    })
    await recordAudit(
      tx,
      {
        action: "vehicle.created",
        resourceType: "vehicle",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return {
      id,
      categoryCode: parsed.data.categoryCode,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year ?? null,
      status: "ready" as const,
      version: 1,
    }
  })
}

export async function createRatePlan(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    name: z.string().min(1).max(120),
    categoryCode: z.string().min(1).max(40),
    netDailyMillimes: z.string().regex(/^\d+$/),
    minimumDays: z.number().int().positive().default(1),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid rate plan", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "rates")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const id = createId("rate")
    await tx.insert(ratePlans).values({
      id,
      agencyId,
      name: parsed.data.name,
      categoryCode: parsed.data.categoryCode,
      netDailyMillimes: BigInt(parsed.data.netDailyMillimes),
      minimumDays: parsed.data.minimumDays,
      active: true,
      effectiveFrom: new Date(),
    })
    await recordAudit(
      tx,
      {
        action: "rate_plan.created",
        resourceType: "rate_plan",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return {
      id,
      name: parsed.data.name,
      categoryCode: parsed.data.categoryCode,
      netDailyMillimes: parsed.data.netDailyMillimes,
      active: true,
      version: 1,
    }
  })
}

export async function completeHandover(
  principal: EffectivePrincipal,
  bookingId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    odometer: z.number().int().nonnegative().optional(),
    fuelLevel: z.string().max(40).optional(),
    conditionNotes: z.string().max(2000).optional(),
    deskCollectedMillimes: z.string().regex(/^\d+$/).default("0"),
    depositMemoMillimes: z.string().regex(/^\d+$/).default("0"),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid handover payload", {
      issues: parsed.error.issues,
    })
  }
  const { agencyId } = requireAgencyContext(principal, "handover")

  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    })
    if (!booking) throw notFound("Booking not found")
    if (booking.agencyId !== agencyId && principal.actorClass !== "admin") {
      throw forbidden("TENANT_SCOPE_VIOLATION", "Booking outside agency")
    }
    if (booking.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Booking version mismatch")
    }
    if (!["confirmed", "held"].includes(booking.status)) {
      throw conflict(
        "ILLEGAL_STATE_TRANSITION",
        `Cannot handover booking in status ${booking.status}`,
      )
    }

    await tx.insert(handoverRecords).values({
      id: createId("hnd"),
      bookingId,
      odometer: parsed.data.odometer,
      fuelLevel: parsed.data.fuelLevel,
      conditionNotes: parsed.data.conditionNotes,
      deskCollectedMillimes: BigInt(parsed.data.deskCollectedMillimes),
      depositMemoMillimes: BigInt(parsed.data.depositMemoMillimes),
      actorUserId: principal.actorUserId,
    })

    if (BigInt(parsed.data.depositMemoMillimes) > BigInt(0)) {
      await tx.insert(depositMemos).values({
        id: createId("dep"),
        bookingId,
        holder: "agency",
        amountMillimes: BigInt(parsed.data.depositMemoMillimes),
        status: "held",
        method: "desk",
      })
    }

    await tx
      .update(bookings)
      .set({
        status: "active",
        version: booking.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))

    await tx.insert(bookingStatusHistory).values({
      id: createId("bhist"),
      bookingId,
      fromStatus: booking.status,
      toStatus: "active",
      actorUserId: principal.actorUserId,
      effectiveUserId: principal.effectiveUserId,
      reasonCode: "handover",
      source: "api",
      requestId: ctx.requestId,
    })

    await recordAudit(
      tx,
      {
        action: "booking.handover_completed",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "agency",
        tenantId: booking.agencyId,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "booking.handover_completed",
      payload: {
        bookingId,
        deskCollectedMillimes: parsed.data.deskCollectedMillimes,
        // Deposit memo is operational only — not commissionable.
        depositMemoMillimes: parsed.data.depositMemoMillimes,
      },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return { bookingId, status: "active" as const, version: booking.version + 1 }
  })
}

export async function completeReturn(
  principal: EffectivePrincipal,
  bookingId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    odometer: z.number().int().nonnegative().optional(),
    fuelLevel: z.string().max(40).optional(),
    conditionNotes: z.string().max(2000).optional(),
    proposedChargesMillimes: z.string().regex(/^\d+$/).default("0"),
    depositReleaseMillimes: z.string().regex(/^\d+$/).default("0"),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid return payload", {
      issues: parsed.error.issues,
    })
  }
  const { agencyId } = requireAgencyContext(principal, "return")

  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    })
    if (!booking) throw notFound("Booking not found")
    if (booking.agencyId !== agencyId && principal.actorClass !== "admin") {
      throw forbidden("TENANT_SCOPE_VIOLATION", "Booking outside agency")
    }
    if (booking.version !== parsed.data.expectedVersion) {
      throw conflict("VERSION_CONFLICT", "Booking version mismatch")
    }
    if (booking.status !== "active") {
      throw conflict(
        "ILLEGAL_STATE_TRANSITION",
        `Cannot return booking in status ${booking.status}`,
      )
    }

    await tx.insert(returnRecords).values({
      id: createId("rtn"),
      bookingId,
      odometer: parsed.data.odometer,
      fuelLevel: parsed.data.fuelLevel,
      conditionNotes: parsed.data.conditionNotes,
      proposedChargesMillimes: BigInt(parsed.data.proposedChargesMillimes),
      depositReleaseMillimes: BigInt(parsed.data.depositReleaseMillimes),
      actorUserId: principal.actorUserId,
    })

    await tx
      .update(depositMemos)
      .set({ status: "released", updatedAt: new Date() })
      .where(
        and(eq(depositMemos.bookingId, bookingId), eq(depositMemos.status, "held")),
      )

    await tx
      .update(bookings)
      .set({
        status: "completed",
        completedAt: new Date(),
        version: booking.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))

    await tx.insert(bookingStatusHistory).values({
      id: createId("bhist"),
      bookingId,
      fromStatus: "active",
      toStatus: "completed",
      actorUserId: principal.actorUserId,
      effectiveUserId: principal.effectiveUserId,
      reasonCode: "return",
      source: "api",
      requestId: ctx.requestId,
    })

    await recordAudit(
      tx,
      {
        action: "booking.return_completed",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "agency",
        tenantId: booking.agencyId,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "booking.return_completed",
      payload: {
        bookingId,
        proposedChargesMillimes: parsed.data.proposedChargesMillimes,
        depositReleaseMillimes: parsed.data.depositReleaseMillimes,
      },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    return {
      bookingId,
      status: "completed" as const,
      version: booking.version + 1,
    }
  })
}

export { ROLE_MATRIX }
