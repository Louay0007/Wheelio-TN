import { and, asc, desc, eq, or, sql } from "drizzle-orm"
import { z } from "zod"
import {
  agencyFees,
  agencyNotificationPreferences,
  agencyNotifications,
  agencyPolicies,
  availabilityBlocks,
  bookingMessages,
  bookings,
  storedObjects,
  vehicleMedia,
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
import {
  requireAgencyContext,
  requireAgencyReadContext,
} from "@/server/modules/agencies/application/ops-extended"

const POLICY_KINDS = [
  "cancellation",
  "mileage",
  "fuel",
  "deposit",
  "drivers",
  "protection",
] as const

const LOCALES = ["en", "fr"] as const

/* -------------------------------------------------------------------------- */
/* Vehicle media                                                              */
/* -------------------------------------------------------------------------- */

export async function listVehicleMedia(
  principal: EffectivePrincipal,
  vehicleId: string,
) {
  const { agencyId } = requireAgencyReadContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const vehicle = await getDb().query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.agencyId, agencyId)),
  })
  if (!vehicle) throw notFound("Vehicle not found")
  const rows = await getDb().query.vehicleMedia.findMany({
    where: eq(vehicleMedia.vehicleId, vehicleId),
    orderBy: [asc(vehicleMedia.sortOrder)],
  })
  return rows.map((r) => ({
    id: r.id,
    vehicleId: r.vehicleId,
    storedObjectId: r.storedObjectId,
    kind: r.kind,
    sortOrder: r.sortOrder,
    caption: r.caption,
    moderationState: r.moderationState,
    version: r.version,
  }))
}

export async function attachVehicleMedia(
  principal: EffectivePrincipal,
  vehicleId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    storedObjectId: z.string().min(1),
    kind: z.enum(["photo", "exterior", "interior", "damage"]).default("photo"),
    sortOrder: z.number().int().min(0).max(100).default(0),
    caption: z.string().max(200).optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid media attach", {
      issues: parsed.error.issues,
    })
  }
  const { agencyId } = requireAgencyContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const vehicle = await tx.query.vehicles.findFirst({
      where: and(eq(vehicles.id, vehicleId), eq(vehicles.agencyId, agencyId)),
    })
    if (!vehicle) throw notFound("Vehicle not found")

    const obj = await tx.query.storedObjects.findFirst({
      where: eq(storedObjects.id, parsed.data.storedObjectId),
    })
    if (!obj) throw notFound("Stored object not found")
    if (obj.purpose !== "vehicle_media") {
      throw validationError("Object purpose must be vehicle_media")
    }
    if (obj.scanStatus !== "clean" && obj.scanStatus !== "pending") {
      throw conflict(
        "UPLOAD_REJECTED",
        `Object scan status is ${obj.scanStatus}`,
      )
    }
    // Stub scan: promote pending → clean on attach (local/dev).
    if (obj.scanStatus === "pending") {
      await tx
        .update(storedObjects)
        .set({ scanStatus: "clean", updatedAt: new Date() })
        .where(eq(storedObjects.id, obj.id))
    }

    const id = createId("vmed")
    await tx.insert(vehicleMedia).values({
      id,
      vehicleId,
      agencyId,
      storedObjectId: obj.id,
      kind: parsed.data.kind,
      sortOrder: parsed.data.sortOrder,
      caption: parsed.data.caption,
      moderationState: "approved",
      publicAt: new Date(),
    })
    await recordAudit(
      tx,
      {
        action: "vehicle.media_attached",
        resourceType: "vehicle_media",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "vehicle",
      aggregateId: vehicleId,
      eventType: "vehicle.media_attached",
      payload: { vehicleId, mediaId: id },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return {
      id,
      vehicleId,
      storedObjectId: obj.id,
      scanStatus: "clean" as const,
      moderationState: "approved" as const,
    }
  })
}

export async function deleteVehicleMedia(
  principal: EffectivePrincipal,
  vehicleId: string,
  mediaId: string,
  ctx: RequestContext,
) {
  const { agencyId } = requireAgencyContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  return withTransaction(getDb(), async (tx) => {
    const row = await tx.query.vehicleMedia.findFirst({
      where: and(
        eq(vehicleMedia.id, mediaId),
        eq(vehicleMedia.vehicleId, vehicleId),
        eq(vehicleMedia.agencyId, agencyId),
      ),
    })
    if (!row) throw notFound("Media not found")
    await tx.delete(vehicleMedia).where(eq(vehicleMedia.id, mediaId))
    await recordAudit(
      tx,
      {
        action: "vehicle.media_removed",
        resourceType: "vehicle_media",
        resourceId: mediaId,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return { id: mediaId, deleted: true as const }
  })
}

/* -------------------------------------------------------------------------- */
/* Availability blocks                                                        */
/* -------------------------------------------------------------------------- */

export async function listAvailabilityBlocks(
  principal: EffectivePrincipal,
  opts?: { vehicleId?: string },
) {
  const { agencyId } = requireAgencyReadContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.availabilityBlocks.findMany({
    where: and(
      eq(availabilityBlocks.agencyId, agencyId),
      eq(availabilityBlocks.status, "active"),
      opts?.vehicleId
        ? eq(availabilityBlocks.vehicleId, opts.vehicleId)
        : undefined,
    ),
    orderBy: [desc(availabilityBlocks.startsAt)],
    limit: 200,
  })
  return rows.map((r) => ({
    id: r.id,
    vehicleId: r.vehicleId,
    branchId: r.branchId,
    kind: r.kind,
    label: r.label,
    reason: r.reason,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    status: r.status,
    version: r.version,
  }))
}

export async function createAvailabilityBlock(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    vehicleId: z.string().optional(),
    branchId: z.string().optional(),
    kind: z
      .enum(["maintenance", "owner_use", "hold", "other"])
      .default("maintenance"),
    label: z.string().min(1).max(160),
    reason: z.string().max(500).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid availability block", {
      issues: parsed.error.issues,
    })
  }
  const starts = new Date(parsed.data.startsAt)
  const ends = new Date(parsed.data.endsAt)
  if (!(ends > starts)) {
    throw validationError("endsAt must be after startsAt")
  }
  const { agencyId } = requireAgencyContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    if (parsed.data.vehicleId) {
      const vehicle = await tx.query.vehicles.findFirst({
        where: and(
          eq(vehicles.id, parsed.data.vehicleId),
          eq(vehicles.agencyId, agencyId),
        ),
      })
      if (!vehicle) throw notFound("Vehicle not found")
    }
    const id = createId("ablk")
    await tx.insert(availabilityBlocks).values({
      id,
      agencyId,
      vehicleId: parsed.data.vehicleId,
      branchId: parsed.data.branchId,
      kind: parsed.data.kind,
      label: parsed.data.label,
      reason: parsed.data.reason,
      startsAt: starts,
      endsAt: ends,
      status: "active",
    })
    await recordAudit(
      tx,
      {
        action: "availability.block_created",
        resourceType: "availability_block",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "availability_block",
      aggregateId: id,
      eventType: "availability.block_created",
      payload: { id, vehicleId: parsed.data.vehicleId ?? null },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return {
      id,
      startsAt: starts.toISOString(),
      endsAt: ends.toISOString(),
      version: 1,
    }
  })
}

export async function deleteAvailabilityBlock(
  principal: EffectivePrincipal,
  blockId: string,
  ctx: RequestContext,
) {
  const { agencyId } = requireAgencyContext(principal, "fleet")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  return withTransaction(getDb(), async (tx) => {
    const row = await tx.query.availabilityBlocks.findFirst({
      where: and(
        eq(availabilityBlocks.id, blockId),
        eq(availabilityBlocks.agencyId, agencyId),
      ),
    })
    if (!row) throw notFound("Block not found")
    await tx
      .update(availabilityBlocks)
      .set({
        status: "cancelled",
        version: row.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(availabilityBlocks.id, blockId))
    await recordAudit(
      tx,
      {
        action: "availability.block_removed",
        resourceType: "availability_block",
        resourceId: blockId,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return { id: blockId, status: "cancelled" as const }
  })
}

/* -------------------------------------------------------------------------- */
/* Policies                                                                   */
/* -------------------------------------------------------------------------- */

export async function listAgencyPolicies(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "policies")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.agencyPolicies.findMany({
    where: eq(agencyPolicies.agencyId, agencyId),
  })
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    locale: r.locale,
    summary: r.summary,
    bodyMarkdown: r.bodyMarkdown,
    rules: r.rulesJson,
    effectiveFrom: r.effectiveFrom.toISOString(),
    version: r.version,
  }))
}

export async function putAgencyPolicy(
  principal: EffectivePrincipal,
  kind: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (!(POLICY_KINDS as readonly string[]).includes(kind)) {
    throw validationError(`Unknown policy kind ${kind}`)
  }
  const schema = z.object({
    locale: z.enum(LOCALES),
    summary: z.string().min(1).max(500),
    bodyMarkdown: z.string().max(20000).default(""),
    rules: z.record(z.string(), z.unknown()).default({}),
    expectedVersion: z.number().int().positive().optional(),
    effectiveFrom: z.string().datetime().optional(),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid policy", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "policies")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.agencyPolicies.findFirst({
      where: and(
        eq(agencyPolicies.agencyId, agencyId),
        eq(agencyPolicies.kind, kind),
        eq(agencyPolicies.locale, parsed.data.locale),
      ),
    })
    if (
      existing &&
      parsed.data.expectedVersion != null &&
      existing.version !== parsed.data.expectedVersion
    ) {
      throw conflict("VERSION_CONFLICT", "Policy version mismatch")
    }
    const effectiveFrom = parsed.data.effectiveFrom
      ? new Date(parsed.data.effectiveFrom)
      : new Date()

    if (existing) {
      await tx
        .update(agencyPolicies)
        .set({
          summary: parsed.data.summary,
          bodyMarkdown: parsed.data.bodyMarkdown,
          rulesJson: parsed.data.rules,
          effectiveFrom,
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(agencyPolicies.id, existing.id))
      await recordAudit(
        tx,
        {
          action: "agency.policy_revised",
          resourceType: "agency_policy",
          resourceId: existing.id,
          tenantType: "agency",
          tenantId: agencyId,
          after: { kind, locale: parsed.data.locale },
        },
        ctx,
        principal,
      )
      return {
        id: existing.id,
        kind,
        locale: parsed.data.locale,
        version: existing.version + 1,
      }
    }

    const id = createId("apol")
    await tx.insert(agencyPolicies).values({
      id,
      agencyId,
      kind,
      locale: parsed.data.locale,
      summary: parsed.data.summary,
      bodyMarkdown: parsed.data.bodyMarkdown,
      rulesJson: parsed.data.rules,
      effectiveFrom,
    })
    await recordAudit(
      tx,
      {
        action: "agency.policy_revised",
        resourceType: "agency_policy",
        resourceId: id,
        tenantType: "agency",
        tenantId: agencyId,
        after: { kind, locale: parsed.data.locale },
      },
      ctx,
      principal,
    )
    return { id, kind, locale: parsed.data.locale, version: 1 }
  })
}

/* -------------------------------------------------------------------------- */
/* Fees                                                                       */
/* -------------------------------------------------------------------------- */

export async function listAgencyFees(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "rates")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.agencyFees.findMany({
    where: eq(agencyFees.agencyId, agencyId),
  })
  return rows
    .filter((r) => !r.includesDeposit)
    .map((r) => ({
      id: r.id,
      code: r.code,
      nameEn: r.nameEn,
      nameFr: r.nameFr,
      amountMillimes: r.amountMillimes.toString(),
      mandatory: r.mandatory,
      active: r.active,
      includesDeposit: false as const,
      version: r.version,
    }))
}

export async function putAgencyFees(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const feeSchema = z.object({
    code: z.string().min(1).max(40),
    nameEn: z.string().min(1).max(120),
    nameFr: z.string().min(1).max(120),
    amountMillimes: z.string().regex(/^\d+$/),
    mandatory: z.boolean().default(false),
    active: z.boolean().default(true),
  })
  const schema = z.object({
    fees: z.array(feeSchema).max(50),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid fees", { issues: parsed.error.issues })
  }
  const { agencyId } = requireAgencyContext(principal, "rates")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    // Replace-active set: upsert by code; never allow includesDeposit=true.
    for (const fee of parsed.data.fees) {
      const existing = await tx.query.agencyFees.findFirst({
        where: and(
          eq(agencyFees.agencyId, agencyId),
          eq(agencyFees.code, fee.code),
        ),
      })
      if (existing) {
        await tx
          .update(agencyFees)
          .set({
            nameEn: fee.nameEn,
            nameFr: fee.nameFr,
            amountMillimes: BigInt(fee.amountMillimes),
            mandatory: fee.mandatory,
            active: fee.active,
            includesDeposit: false,
            version: existing.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(agencyFees.id, existing.id))
      } else {
        await tx.insert(agencyFees).values({
          id: createId("fee"),
          agencyId,
          code: fee.code,
          nameEn: fee.nameEn,
          nameFr: fee.nameFr,
          amountMillimes: BigInt(fee.amountMillimes),
          mandatory: fee.mandatory,
          active: fee.active,
          includesDeposit: false,
        })
      }
    }
    await recordAudit(
      tx,
      {
        action: "agency.fees_revised",
        resourceType: "agency_fees",
        resourceId: agencyId,
        tenantType: "agency",
        tenantId: agencyId,
        after: { count: parsed.data.fees.length, includesDeposit: false },
      },
      ctx,
      principal,
    )
    return { updated: parsed.data.fees.length, includesDeposit: false as const }
  })
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export async function listAgencyNotifications(principal: EffectivePrincipal) {
  const { agencyId } = requireAgencyReadContext(principal, "notifications")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.agencyNotifications.findMany({
    where: and(
      eq(agencyNotifications.agencyId, agencyId),
      or(
        eq(agencyNotifications.userId, principal.effectiveUserId),
        sql`${agencyNotifications.userId} is null`,
      ),
    ),
    orderBy: [desc(agencyNotifications.createdAt)],
    limit: 100,
  })
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    href: r.href,
    read: Boolean(r.readAt),
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function markAgencyNotificationsRead(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    ids: z.array(z.string()).min(1).max(100).optional(),
    all: z.boolean().default(false),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid read payload", {
      issues: parsed.error.issues,
    })
  }
  const { agencyId } = requireAgencyContext(principal, "notifications")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    const now = new Date()
    if (parsed.data.all) {
      await tx
        .update(agencyNotifications)
        .set({ readAt: now })
        .where(
          and(
            eq(agencyNotifications.agencyId, agencyId),
            sql`${agencyNotifications.readAt} is null`,
          ),
        )
    } else if (parsed.data.ids) {
      for (const id of parsed.data.ids) {
        await tx
          .update(agencyNotifications)
          .set({ readAt: now })
          .where(
            and(
              eq(agencyNotifications.id, id),
              eq(agencyNotifications.agencyId, agencyId),
            ),
          )
      }
    }
    await recordAudit(
      tx,
      {
        action: "agency.notifications_read",
        resourceType: "agency_notification",
        resourceId: agencyId,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return { ok: true as const }
  })
}

const DEFAULT_EVENT_KEYS = [
  "booking_request",
  "booking_message",
  "cancellation",
  "payout",
  "sla_warning",
] as const

export async function getAgencyNotificationPreferences(
  principal: EffectivePrincipal,
) {
  const { agencyId } = requireAgencyReadContext(principal, "notifications")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")
  const rows = await getDb().query.agencyNotificationPreferences.findMany({
    where: and(
      eq(agencyNotificationPreferences.agencyId, agencyId),
      eq(agencyNotificationPreferences.userId, principal.effectiveUserId),
    ),
  })
  const byKey = new Map(rows.map((r) => [r.eventKey, r]))
  return DEFAULT_EVENT_KEYS.map((eventKey) => {
    const row = byKey.get(eventKey)
    return {
      eventKey,
      emailEnabled: row?.emailEnabled ?? true,
      smsEnabled: row?.smsEnabled ?? false,
      inAppEnabled: row?.inAppEnabled ?? true,
      // Transactional booking_request email cannot be disabled.
      emailLocked: eventKey === "booking_request",
    }
  })
}

export async function putAgencyNotificationPreferences(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  const schema = z.object({
    preferences: z
      .array(
        z.object({
          eventKey: z.enum(DEFAULT_EVENT_KEYS),
          emailEnabled: z.boolean(),
          smsEnabled: z.boolean(),
          inAppEnabled: z.boolean(),
        }),
      )
      .min(1),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid preferences", {
      issues: parsed.error.issues,
    })
  }
  const { agencyId } = requireAgencyContext(principal, "notifications")
  if (!agencyId) throw forbidden("FORBIDDEN", "No agency context")

  return withTransaction(getDb(), async (tx) => {
    for (const pref of parsed.data.preferences) {
      const emailEnabled =
        pref.eventKey === "booking_request" ? true : pref.emailEnabled
      const existing = await tx.query.agencyNotificationPreferences.findFirst({
        where: and(
          eq(agencyNotificationPreferences.agencyId, agencyId),
          eq(agencyNotificationPreferences.userId, principal.effectiveUserId),
          eq(agencyNotificationPreferences.eventKey, pref.eventKey),
        ),
      })
      if (existing) {
        await tx
          .update(agencyNotificationPreferences)
          .set({
            emailEnabled,
            smsEnabled: pref.smsEnabled,
            inAppEnabled: pref.inAppEnabled,
            updatedAt: new Date(),
          })
          .where(eq(agencyNotificationPreferences.id, existing.id))
      } else {
        await tx.insert(agencyNotificationPreferences).values({
          id: createId("anp"),
          agencyId,
          userId: principal.effectiveUserId,
          eventKey: pref.eventKey,
          emailEnabled,
          smsEnabled: pref.smsEnabled,
          inAppEnabled: pref.inAppEnabled,
        })
      }
    }
    await recordAudit(
      tx,
      {
        action: "agency.notification_preferences_updated",
        resourceType: "agency_notification_preferences",
        resourceId: agencyId,
        tenantType: "agency",
        tenantId: agencyId,
      },
      ctx,
      principal,
    )
    return { ok: true as const }
  })
}

/* -------------------------------------------------------------------------- */
/* Booking messages                                                           */
/* -------------------------------------------------------------------------- */

export async function listBookingMessages(
  principal: EffectivePrincipal,
  bookingId: string,
) {
  const booking = await getDb().query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
  })
  if (!booking) throw notFound("Booking not found")
  assertBookingMessageAccess(principal, booking)

  const rows = await getDb().query.bookingMessages.findMany({
    where: eq(bookingMessages.bookingId, bookingId),
    orderBy: [desc(bookingMessages.createdAt)],
    limit: 200,
  })
  return rows
    .filter((r) => canSeeMessage(principal, r.visibility, r.staffMarked))
    .map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      authorClass: r.authorClass,
      visibility: r.visibility,
      body: r.body,
      staffMarked: r.staffMarked,
      createdAt: r.createdAt.toISOString(),
    }))
}

export async function postBookingMessage(
  principal: EffectivePrincipal,
  bookingId: string,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot send messages",
    )
  }
  const schema = z.object({
    body: z.string().min(1).max(4000),
    visibility: z
      .enum(["customer", "agency", "internal", "both"])
      .default("both"),
  })
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid message", { issues: parsed.error.issues })
  }

  const booking = await getDb().query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
  })
  if (!booking) throw notFound("Booking not found")
  assertBookingMessageAccess(principal, booking, { write: true })

  const staffMarked = principal.actorClass === "admin"

  return withTransaction(getDb(), async (tx) => {
    const id = createId("bmsg")
    await tx.insert(bookingMessages).values({
      id,
      bookingId,
      authorUserId: principal.actorUserId,
      authorClass: principal.actorClass,
      visibility: parsed.data.visibility,
      body: parsed.data.body,
      staffMarked,
    })
    await recordAudit(
      tx,
      {
        action: "message.created",
        resourceType: "booking_message",
        resourceId: id,
        tenantType: "agency",
        tenantId: booking.agencyId,
        after: {
          visibility: parsed.data.visibility,
          staffMarked,
        },
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "message.created",
      payload: { bookingId, messageId: id, staffMarked },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return {
      id,
      bookingId,
      visibility: parsed.data.visibility,
      staffMarked,
    }
  })
}

function assertBookingMessageAccess(
  principal: EffectivePrincipal,
  booking: { agencyId: string; customerProfileId: string | null },
  opts?: { write?: boolean },
) {
  if (principal.actorClass === "admin") {
    if (opts?.write && principal.impersonating) {
      throw forbidden(
        "IMPERSONATION_READ_ONLY",
        "Impersonation cannot send messages",
      )
    }
    return
  }
  if (principal.actorClass === "agency") {
    const ok = principal.agencyMemberships.some(
      (m) => m.agencyId === booking.agencyId && m.status === "active",
    )
    if (!ok) {
      throw forbidden("TENANT_SCOPE_VIOLATION", "Booking outside agency")
    }
    if (opts?.write) {
      requireAgencyContext(principal, "messages")
    }
    return
  }
  if (principal.actorClass === "customer") {
    if (
      !booking.customerProfileId ||
      booking.customerProfileId !== principal.customerProfileId
    ) {
      throw forbidden("TENANT_SCOPE_VIOLATION", "Booking outside customer")
    }
    return
  }
  throw forbidden("FORBIDDEN", "Cannot access booking messages")
}

function canSeeMessage(
  principal: EffectivePrincipal,
  visibility: string,
  staffMarked: boolean,
) {
  void staffMarked
  if (principal.actorClass === "admin") return true
  if (visibility === "internal") return false
  if (visibility === "agency") return principal.actorClass === "agency"
  if (visibility === "customer") return principal.actorClass === "customer"
  // visibility === "both"
  return (
    principal.actorClass === "agency" || principal.actorClass === "customer"
  )
}
