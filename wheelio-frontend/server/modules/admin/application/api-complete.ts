import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"
import {
  adminMemberships,
  adminNotifications,
  agencies,
  agencyDocuments,
  agencyMemberships,
  bookingSnapshots,
  bookings,
  branches,
  customerProfiles,
  feesCatalog,
  locations,
  payoutBatches,
  platformSettings,
  promotions,
  ratePlans,
  refundRequests,
  reviews,
  slaPolicies,
  user,
  vehicleCategories,
  vehicleCategoryTranslations,
  vehicles,
} from "@/db/schema"
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
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"

function requireAdmin(principal: EffectivePrincipal, write = false) {
  if (write && principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot mutate admin resources",
    )
  }
  if (!principal.adminMembership || principal.adminMembership.status !== "active") {
    throw forbidden("FORBIDDEN", "Admin membership required")
  }
}

async function requireAgency(agencyId: string) {
  const agency = await getDb().query.agencies.findFirst({
    where: eq(agencies.id, agencyId),
  })
  if (!agency) throw notFound("Agency not found")
  return agency
}

export async function getAdminAgencyBranches(
  principal: EffectivePrincipal,
  agencyId: string,
) {
  requireAdmin(principal)
  await requireAgency(agencyId)
  const rows = await getDb().query.branches.findMany({
    where: eq(branches.agencyId, agencyId),
  })
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city,
    active: b.active,
  }))
}

export async function getAdminAgencyFleet(
  principal: EffectivePrincipal,
  agencyId: string,
) {
  requireAdmin(principal)
  await requireAgency(agencyId)
  const rows = await getDb().query.vehicles.findMany({
    where: eq(vehicles.agencyId, agencyId),
  })
  return rows.map((v) => ({
    id: v.id,
    make: v.make,
    model: v.model,
    categoryCode: v.categoryCode,
    status: v.status,
  }))
}

export async function getAdminAgencyStaff(
  principal: EffectivePrincipal,
  agencyId: string,
) {
  requireAdmin(principal)
  await requireAgency(agencyId)
  const rows = await getDb()
    .select({
      id: agencyMemberships.id,
      userId: agencyMemberships.userId,
      role: agencyMemberships.role,
      status: agencyMemberships.status,
      email: user.email,
      name: user.name,
    })
    .from(agencyMemberships)
    .innerJoin(user, eq(user.id, agencyMemberships.userId))
    .where(eq(agencyMemberships.agencyId, agencyId))
  return rows
}

export async function getAdminAgencyRates(
  principal: EffectivePrincipal,
  agencyId: string,
) {
  requireAdmin(principal)
  await requireAgency(agencyId)
  const rows = await getDb().query.ratePlans.findMany({
    where: eq(ratePlans.agencyId, agencyId),
  })
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    categoryCode: r.categoryCode,
    dailyMillimes: r.netDailyMillimes.toString(),
    active: r.active,
  }))
}

export async function getAdminAgencyPayouts(
  principal: EffectivePrincipal,
  agencyId: string,
) {
  requireAdmin(principal)
  await requireAgency(agencyId)
  const rows = await getDb().query.payoutBatches.findMany({
    where: eq(payoutBatches.agencyId, agencyId),
    orderBy: [desc(payoutBatches.createdAt)],
  })
  return rows.map((p) => ({
    id: p.id,
    status: p.status,
    totalMillimes: p.totalMillimes.toString(),
  }))
}

export async function getAdminAgencyDocuments(
  principal: EffectivePrincipal,
  agencyId: string,
) {
  requireAdmin(principal)
  await requireAgency(agencyId)
  const rows = await getDb().query.agencyDocuments.findMany({
    where: eq(agencyDocuments.agencyId, agencyId),
  })
  return rows.map((d) => ({
    id: d.id,
    kind: d.kind,
    title: d.title,
    status: d.status,
  }))
}

export async function getAdminAgencyContract(
  principal: EffectivePrincipal,
  agencyId: string,
) {
  requireAdmin(principal)
  const agency = await requireAgency(agencyId)
  return {
    agencyId,
    legalName: agency.legalName,
    tradeName: agency.tradeName,
    verificationStatus: agency.verificationStatus,
    commissionTierBps: agency.commissionTierBps,
    bookingMode: agency.bookingMode,
    contractStatus:
      agency.verificationStatus === "verified" ? "active" : "pending",
  }
}

export async function getAdminAgencyQuality(
  principal: EffectivePrincipal,
  agencyId: string,
) {
  requireAdmin(principal)
  await requireAgency(agencyId)
  const bookingRows = await getDb().query.bookings.findMany({
    where: eq(bookings.agencyId, agencyId),
  })
  const reviewRows = await getDb().query.reviews.findMany({
    where: eq(reviews.agencyId, agencyId),
  })
  const avg =
    reviewRows.length === 0
      ? 0
      : reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length
  return {
    agencyId,
    bookings: bookingRows.length,
    reviews: reviewRows.length,
    averageRating: avg,
    note: "Deposit excluded from commercial quality scoring",
  }
}

export async function overrideBooking(
  principal: EffectivePrincipal,
  bookingId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    status: z.string().min(2).max(40),
    reason: z.string().min(3).max(500),
    expectedVersion: z.number().int().positive(),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid override", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    })
    if (!booking) throw notFound("Booking not found")
    if (booking.version !== parsed.data.expectedVersion) {
      throw validationError("Version conflict")
    }
    const [updated] = await tx
      .update(bookings)
      .set({
        status: parsed.data.status,
        version: booking.version + 1,
      })
      .where(eq(bookings.id, bookingId))
      .returning()
    await recordAudit(
      tx,
      {
        action: "admin.booking.overridden",
        resourceType: "booking",
        resourceId: bookingId,
        tenantType: "platform",
        tenantId: "platform",
        reason: parsed.data.reason,
        before: { status: booking.status },
        after: { status: updated.status },
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "booking",
      aggregateId: bookingId,
      eventType: "admin.booking.overridden",
      payload: {
        bookingId,
        status: updated.status,
        reason: parsed.data.reason,
      },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return {
      bookingId,
      status: updated.status,
      version: updated.version,
    }
  })
}

export async function getCustomerBookings(
  principal: EffectivePrincipal,
  userId: string,
) {
  requireAdmin(principal)
  const profile = await getDb().query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, userId),
  })
  if (!profile) return []
  const rows = await getDb().query.bookings.findMany({
    where: eq(bookings.customerProfileId, profile.id),
    orderBy: [desc(bookings.createdAt)],
    limit: 100,
  })
  return rows.map((b) => ({
    id: b.id,
    reference: b.reference,
    status: b.status,
    agencyId: b.agencyId,
    pickupAt: b.pickupAt.toISOString(),
    returnAt: b.returnAt.toISOString(),
  }))
}

export async function getCustomerRisk(
  principal: EffectivePrincipal,
  userId: string,
) {
  requireAdmin(principal)
  const profile = await getDb().query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, userId),
  })
  if (!profile) throw notFound("Customer profile not found")
  const bookingRows = await getDb().query.bookings.findMany({
    where: eq(bookings.customerProfileId, profile.id),
  })
  const cancelled = bookingRows.filter((b) =>
    b.status.includes("cancel"),
  ).length
  return {
    userId,
    profileId: profile.id,
    riskStatus: profile.riskStatus,
    bookingsTotal: bookingRows.length,
    cancellations: cancelled,
    flags: cancelled >= 3 ? ["high_cancel_rate"] : [],
  }
}

export async function listCategoriesAdmin(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const cats = await getDb().query.vehicleCategories.findMany()
  const tr = await getDb().query.vehicleCategoryTranslations.findMany()
  return cats.map((c) => ({
    id: c.id,
    code: c.code,
    active: c.active,
    sortOrder: c.sortOrder,
    translations: tr
      .filter((t) => t.categoryId === c.id)
      .map((t) => ({ locale: t.locale, name: t.label })),
  }))
}

export async function upsertCategory(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    id: z.string().optional(),
    code: z.string().min(2).max(40),
    active: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    nameEn: z.string().min(2).max(80),
    nameFr: z.string().min(2).max(80),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid category", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    if (parsed.data.id) {
      const [updated] = await tx
        .update(vehicleCategories)
        .set({
          code: parsed.data.code,
          active: parsed.data.active,
          sortOrder: parsed.data.sortOrder,
        })
        .where(eq(vehicleCategories.id, parsed.data.id))
        .returning()
      if (!updated) throw notFound("Category not found")
      return { id: updated.id, code: updated.code }
    }
    const id = createId("cat")
    await tx.insert(vehicleCategories).values({
      id,
      code: parsed.data.code,
      active: parsed.data.active,
      sortOrder: parsed.data.sortOrder,
    })
    await tx.insert(vehicleCategoryTranslations).values([
      {
        id: createId("ctr"),
        categoryId: id,
        locale: "en",
        label: parsed.data.nameEn,
      },
      {
        id: createId("ctr"),
        categoryId: id,
        locale: "fr",
        label: parsed.data.nameFr,
      },
    ])
    await recordAudit(
      tx,
      {
        action: "admin.category.created",
        resourceType: "vehicle_category",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { id, code: parsed.data.code }
  })
}

export async function listVehiclesAdmin(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.vehicles.findMany({
    orderBy: [desc(vehicles.updatedAt)],
    limit: 200,
  })
  return rows.map((v) => ({
    id: v.id,
    agencyId: v.agencyId,
    make: v.make,
    model: v.model,
    categoryCode: v.categoryCode,
    status: v.status,
    active: v.active,
  }))
}

export async function getVehicleAdmin(
  principal: EffectivePrincipal,
  vehicleId: string,
) {
  requireAdmin(principal)
  const v = await getDb().query.vehicles.findFirst({
    where: eq(vehicles.id, vehicleId),
  })
  if (!v) throw notFound("Vehicle not found")
  return {
    id: v.id,
    agencyId: v.agencyId,
    branchId: v.branchId,
    make: v.make,
    model: v.model,
    year: v.year,
    categoryCode: v.categoryCode,
    status: v.status,
    visibility: v.visibility,
    active: v.active,
    version: v.version,
  }
}

export async function listFeesCatalog(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.feesCatalog.findMany()
  return rows.map((f) => ({
    id: f.id,
    code: f.code,
    nameEn: f.nameEn,
    nameFr: f.nameFr,
    defaultMillimes: f.defaultMillimes,
    active: f.active,
    isDeposit: f.isDeposit,
  }))
}

export async function upsertFeesCatalog(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    id: z.string().optional(),
    code: z.string().min(2).max(40),
    nameEn: z.string().min(2).max(80),
    nameFr: z.string().min(2).max(80),
    defaultMillimes: z.number().int().min(0),
    active: z.boolean().default(true),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid fee", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    if (parsed.data.id) {
      const [updated] = await tx
        .update(feesCatalog)
        .set({
          code: parsed.data.code,
          nameEn: parsed.data.nameEn,
          nameFr: parsed.data.nameFr,
          defaultMillimes: parsed.data.defaultMillimes,
          active: parsed.data.active,
          isDeposit: false,
        })
        .where(eq(feesCatalog.id, parsed.data.id))
        .returning()
      if (!updated) throw notFound("Fee not found")
      return { id: updated.id, code: updated.code, isDeposit: false }
    }
    const id = createId("fee")
    await tx.insert(feesCatalog).values({
      id,
      code: parsed.data.code,
      nameEn: parsed.data.nameEn,
      nameFr: parsed.data.nameFr,
      defaultMillimes: parsed.data.defaultMillimes,
      active: parsed.data.active,
      isDeposit: false,
    })
    await recordAudit(
      tx,
      {
        action: "admin.fees_catalog.upserted",
        resourceType: "fees_catalog",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { id, code: parsed.data.code, isDeposit: false }
  })
}

export async function listSla(principal: EffectivePrincipal) {
  requireAdmin(principal)
  let rows = await getDb().query.slaPolicies.findMany()
  if (rows.length === 0) {
    await getDb().insert(slaPolicies).values({
      id: createId("sla"),
      key: "booking_acceptance",
      name: "Booking acceptance",
      targetMinutes: 120,
      appliesTo: "booking_acceptance",
    })
    rows = await getDb().query.slaPolicies.findMany()
  }
  return rows.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    targetMinutes: s.targetMinutes,
    appliesTo: s.appliesTo,
    active: s.active,
  }))
}

export async function upsertSla(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    id: z.string().optional(),
    key: z.string().min(2).max(60),
    name: z.string().min(2).max(120),
    targetMinutes: z.number().int().min(1),
    appliesTo: z.string().min(2).max(60),
    active: z.boolean().default(true),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid SLA", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    if (parsed.data.id) {
      const [updated] = await tx
        .update(slaPolicies)
        .set({
          key: parsed.data.key,
          name: parsed.data.name,
          targetMinutes: parsed.data.targetMinutes,
          appliesTo: parsed.data.appliesTo,
          active: parsed.data.active,
        })
        .where(eq(slaPolicies.id, parsed.data.id))
        .returning()
      if (!updated) throw notFound("SLA not found")
      return { id: updated.id, key: updated.key }
    }
    const id = createId("sla")
    await tx.insert(slaPolicies).values({
      id,
      key: parsed.data.key,
      name: parsed.data.name,
      targetMinutes: parsed.data.targetMinutes,
      appliesTo: parsed.data.appliesTo,
      active: parsed.data.active,
    })
    await recordAudit(
      tx,
      {
        action: "admin.sla.upserted",
        resourceType: "sla_policy",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { id, key: parsed.data.key }
  })
}

export async function getPlatformSettings(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.platformSettings.findMany()
  return Object.fromEntries(rows.map((r) => [r.key, r.valueJson]))
}

export async function putPlatformSettings(
  principal: EffectivePrincipal,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    key: z.string().min(2).max(80),
    value: z.record(z.string(), z.unknown()),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid settings", { issues: parsed.error.issues })
  }
  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.platformSettings.findFirst({
      where: eq(platformSettings.key, parsed.data.key),
    })
    if (existing) {
      await tx
        .update(platformSettings)
        .set({
          valueJson: parsed.data.value,
          version: existing.version + 1,
        })
        .where(eq(platformSettings.id, existing.id))
    } else {
      await tx.insert(platformSettings).values({
        id: createId("pst"),
        key: parsed.data.key,
        valueJson: parsed.data.value,
      })
    }
    await recordAudit(
      tx,
      {
        action: "admin.settings.updated",
        resourceType: "platform_settings",
        resourceId: parsed.data.key,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { key: parsed.data.key, value: parsed.data.value }
  })
}

export async function listAdminNotifications(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.adminNotifications.findMany({
    orderBy: [desc(adminNotifications.createdAt)],
    limit: 100,
  })
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    kind: n.kind,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }))
}

export async function getPromotion(
  principal: EffectivePrincipal,
  promoId: string,
) {
  requireAdmin(principal)
  const p = await getDb().query.promotions.findFirst({
    where: eq(promotions.id, promoId),
  })
  if (!p) throw notFound("Promotion not found")
  return {
    id: p.id,
    code: p.code,
    nameEn: p.nameEn,
    nameFr: p.nameFr,
    discountBps: p.discountBps,
    status: p.status,
    appliesToDeposit: p.appliesToDeposit,
    version: p.version,
  }
}

export async function getRefund(
  principal: EffectivePrincipal,
  refundId: string,
) {
  requireAdmin(principal)
  const r = await getDb().query.refundRequests.findFirst({
    where: eq(refundRequests.id, refundId),
  })
  if (!r) throw notFound("Refund not found")
  return {
    id: r.id,
    bookingId: r.bookingId,
    status: r.status,
    reason: r.reason,
    customerAmountMillimes: r.customerAmountMillimes.toString(),
    includesDeposit: r.includesDeposit,
  }
}

export async function getStaffMember(
  principal: EffectivePrincipal,
  staffId: string,
) {
  requireAdmin(principal)
  const row = await getDb()
    .select({
      id: adminMemberships.id,
      userId: adminMemberships.userId,
      role: adminMemberships.role,
      status: adminMemberships.status,
      email: user.email,
      name: user.name,
    })
    .from(adminMemberships)
    .innerJoin(user, eq(user.id, adminMemberships.userId))
    .where(eq(adminMemberships.id, staffId))
    .limit(1)
  if (!row[0]) throw notFound("Staff member not found")
  return row[0]
}

export async function getLocationBySlug(
  principal: EffectivePrincipal,
  slug: string,
) {
  requireAdmin(principal)
  const loc = await getDb().query.locations.findFirst({
    where: eq(locations.slug, slug),
  })
  if (!loc) throw notFound("Location not found")
  return {
    id: loc.id,
    slug: loc.slug,
    type: loc.type,
    region: loc.region,
    status: loc.status,
    searchPickup: loc.searchPickup,
  }
}

export async function moderateReview(
  principal: EffectivePrincipal,
  reviewId: string,
  raw: unknown,
  ctx: RequestContext,
) {
  requireAdmin(principal, true)
  const schema = z.object({
    status: z.enum(["pending", "published", "rejected", "hidden"]),
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw validationError("Invalid moderation", {
      issues: parsed.error.issues,
    })
  }
  return withTransaction(getDb(), async (tx) => {
    const review = await tx.query.reviews.findFirst({
      where: eq(reviews.id, reviewId),
    })
    if (!review) throw notFound("Review not found")
    const [updated] = await tx
      .update(reviews)
      .set({ status: parsed.data.status })
      .where(eq(reviews.id, reviewId))
      .returning()
    await recordAudit(
      tx,
      {
        action: "admin.review.moderated",
        resourceType: "review",
        resourceId: reviewId,
        tenantType: "platform",
        tenantId: "platform",
        after: { status: updated.status },
      },
      ctx,
      principal,
    )
    return { id: updated.id, status: updated.status }
  })
}

export async function listContentReviews(principal: EffectivePrincipal) {
  requireAdmin(principal)
  const rows = await getDb().query.reviews.findMany({
    orderBy: [desc(reviews.createdAt)],
    limit: 100,
  })
  return rows.map((r) => ({
    id: r.id,
    agencyId: r.agencyId,
    rating: r.rating,
    status: r.status,
    body: r.body,
    authorDisplayName: r.authorDisplayName,
  }))
}

export async function analyticsBySlice(
  principal: EffectivePrincipal,
  slice: "demand" | "supply" | "finance" | "quality",
) {
  requireAdmin(principal)
  const bookingRows = await getDb().query.bookings.findMany({ limit: 500 })
  const snaps = await getDb().query.bookingSnapshots.findMany({ limit: 500 })
  const gmv = snaps.reduce((s, x) => s + x.commissionableMillimes, 0n)
  const commission = snaps.reduce((s, x) => s + x.commissionMillimes, 0n)
  const base = {
    slice,
    includesDeposit: false,
    bookings: bookingRows.length,
  }
  if (slice === "finance") {
    return {
      ...base,
      gmvMillimes: gmv.toString(),
      commissionMillimes: commission.toString(),
    }
  }
  if (slice === "demand") {
    return {
      ...base,
      requested: bookingRows.filter((b) => b.status === "requested").length,
      confirmed: bookingRows.filter((b) => b.status === "confirmed").length,
    }
  }
  if (slice === "supply") {
    const fleet = await getDb().query.vehicles.findMany({ limit: 500 })
    return {
      ...base,
      vehicles: fleet.length,
      ready: fleet.filter((v) => v.status === "ready").length,
    }
  }
  return {
    ...base,
    completed: bookingRows.filter((b) => b.status === "completed").length,
    cancelled: bookingRows.filter((b) => b.status.includes("cancel")).length,
  }
}
