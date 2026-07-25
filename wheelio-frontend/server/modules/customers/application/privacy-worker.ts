import { createHash } from "node:crypto"
import { and, eq, lte } from "drizzle-orm"
import {
  account, auditEvents, bookings, consentEvents, customerDrivers,
  customerNotifications, customerProfiles, notificationPreferences,
  outboxEvents, privacyRequests, savedOffers, savedSearches, session,
  storedObjects, user,
} from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import { getEnv } from "@/server/core/env"
import { getMinioClient } from "@/server/core/storage/minio"

const EXPORT_RETENTION_MS = 7 * 86400_000
const FINANCIAL_RETENTION_MS = 7 * 365 * 86400_000

function safeJson(value: unknown) {
  return JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item, 2)
}

async function buildArchive(profileId: string, userId: string) {
  const db = getDb()
  const [profile, identity, drivers, notifications, preferences, searches, offers, requests, customerBookings, consents, audits] = await Promise.all([
    db.query.customerProfiles.findFirst({ where: eq(customerProfiles.id, profileId) }),
    db.query.user.findFirst({ where: eq(user.id, userId), columns: { id: true, name: true, email: true, emailVerified: true, twoFactorEnabled: true, createdAt: true, updatedAt: true } }),
    db.query.customerDrivers.findMany({ where: eq(customerDrivers.customerProfileId, profileId) }),
    db.query.customerNotifications.findMany({ where: eq(customerNotifications.customerProfileId, profileId) }),
    db.query.notificationPreferences.findMany({ where: and(eq(notificationPreferences.principalType, "customer"), eq(notificationPreferences.principalId, profileId)) }),
    db.query.savedSearches.findMany({ where: eq(savedSearches.customerProfileId, profileId) }),
    db.query.savedOffers.findMany({ where: eq(savedOffers.customerProfileId, profileId) }),
    db.query.privacyRequests.findMany({ where: eq(privacyRequests.customerProfileId, profileId) }),
    db.query.bookings.findMany({ where: eq(bookings.customerProfileId, profileId), with: { snapshot: true, statusHistory: true } }),
    db.query.consentEvents.findMany({ where: and(eq(consentEvents.subjectType, "customer"), eq(consentEvents.subjectId, profileId)) }),
    db.query.auditEvents.findMany({ where: eq(auditEvents.effectiveUserId, userId) }),
  ])
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), subject: { userId, profileId }, identity, profile, drivers, notifications, notificationPreferences: preferences, savedSearches: searches, savedOffers: offers, privacyRequests: requests, bookings: customerBookings, consentEvents: consents, auditEvents: audits }
}

async function processExport(request: typeof privacyRequests.$inferSelect, userId: string) {
  const archive = Buffer.from(safeJson(await buildArchive(request.customerProfileId, userId)))
  const checksum = createHash("sha256").update(archive).digest("hex")
  const objectId = createId("obj")
  const objectKey = `privacy-exports/${request.customerProfileId}/${request.id}.json`
  const bucket = getEnv().MINIO_PRIVATE_BUCKET
  await getMinioClient().putObject(bucket, objectKey, archive, archive.length, { "Content-Type": "application/json", "x-amz-meta-sha256": checksum })
  const expires = new Date(Date.now() + EXPORT_RETENTION_MS)
  await withTransaction(getDb(), async (tx) => {
    await tx.insert(storedObjects).values({ id: objectId, bucket, objectKey, ownerType: "privacy_request", ownerId: request.id, purpose: "privacy_export", classification: "private", mimeType: "application/json", sizeBytes: archive.length, checksumSha256: checksum, scanStatus: "clean", retentionUntil: expires })
    await tx.update(privacyRequests).set({ status: "completed", artifactObjectId: objectId, artifactExpiresAt: expires, completedAt: new Date(), failureReason: null }).where(and(eq(privacyRequests.id, request.id), eq(privacyRequests.status, "processing")))
    await appendSystemEvents(tx, request, "privacy.export_completed", { objectId, checksum, sizeBytes: archive.length })
  })
}

export function privacyDeletionRetention(hasBookings: boolean, now = new Date()) {
  return hasBookings ? new Date(now.getTime() + FINANCIAL_RETENTION_MS) : null
}

async function processDeletion(request: typeof privacyRequests.$inferSelect, userId: string) {
  const db = getDb()
  const retainedBookings = await db.query.bookings.findMany({ where: eq(bookings.customerProfileId, request.customerProfileId), columns: { id: true } })
  const retentionUntil = privacyDeletionRetention(retainedBookings.length > 0)
  const anon = `deleted-${createHash("sha256").update(userId).digest("hex").slice(0, 20)}@privacy.invalid`
  await withTransaction(db, async (tx) => {
    await tx.delete(session).where(eq(session.userId, userId))
    await tx.delete(account).where(eq(account.userId, userId))
    await tx.delete(customerDrivers).where(eq(customerDrivers.customerProfileId, request.customerProfileId))
    await tx.delete(customerNotifications).where(eq(customerNotifications.customerProfileId, request.customerProfileId))
    await tx.delete(savedSearches).where(eq(savedSearches.customerProfileId, request.customerProfileId))
    await tx.delete(savedOffers).where(eq(savedOffers.customerProfileId, request.customerProfileId))
    await tx.delete(notificationPreferences).where(and(eq(notificationPreferences.principalType, "customer"), eq(notificationPreferences.principalId, request.customerProfileId)))
    await tx.update(bookings).set({ guestEmail: null }).where(eq(bookings.customerProfileId, request.customerProfileId))
    await tx.update(customerProfiles).set({ legalName: "Deleted customer", preferredName: null, phone: null, phoneNormalized: null, dateOfBirth: null, nationality: null, residenceCountry: null, addressLine: null, city: null, marketingOptIn: false, extrasInterests: [] }).where(eq(customerProfiles.id, request.customerProfileId))
    await tx.update(user).set({ name: "Deleted customer", email: anon, image: null, emailVerified: false, twoFactorEnabled: false, updatedAt: new Date() }).where(eq(user.id, userId))
    await tx.update(privacyRequests).set({ status: retentionUntil ? "awaiting_retention" : "completed", legalHoldReason: retentionUntil ? "Contract, booking, tax and financial records retained in anonymized form for statutory obligations" : null, retentionUntil, completedAt: new Date(), failureReason: null }).where(and(eq(privacyRequests.id, request.id), eq(privacyRequests.status, "processing")))
    await appendSystemEvents(tx, request, retentionUntil ? "privacy.deletion_anonymized_retained" : "privacy.deletion_completed", { retainedBookingCount: retainedBookings.length, retentionUntil: retentionUntil?.toISOString() ?? null })
  })
}

import type { DbTransaction } from "@/server/core/database/transaction"

type Tx = DbTransaction
async function appendSystemEvents(tx: Tx, request: typeof privacyRequests.$inferSelect, eventType: string, metadata: Record<string, unknown>) {
  await tx.insert(auditEvents).values({ id: createId("aud"), actorClass: "system", action: eventType, resourceType: "privacy_request", resourceId: request.id, tenantType: "customer", tenantId: request.customerProfileId, metadata })
  await tx.insert(outboxEvents).values({ id: createId("evt"), aggregateType: "privacy_request", aggregateId: request.id, eventType, payload: { requestId: request.id, profileId: request.customerProfileId, ...metadata } })
}

export async function processPrivacyRequest(requestId: string) {
  const db = getDb()
  const [claimed] = await db.update(privacyRequests).set({ status: "processing", processingStartedAt: new Date(), failureReason: null }).where(and(eq(privacyRequests.id, requestId), eq(privacyRequests.status, "queued"))).returning()
  if (!claimed) return { skipped: true }
  const profile = await db.query.customerProfiles.findFirst({ where: eq(customerProfiles.id, claimed.customerProfileId) })
  if (!profile) throw new Error("Privacy request customer profile not found")
  try {
    if (claimed.requestType === "export") await processExport(claimed, profile.userId)
    else if (claimed.requestType === "deletion") await processDeletion(claimed, profile.userId)
    else throw new Error(`Unsupported privacy request type: ${claimed.requestType}`)
    return { skipped: false }
  } catch (error) {
    await db.update(privacyRequests).set({ status: "failed", failureReason: error instanceof Error ? error.message.slice(0, 1000) : "Unknown worker error", completedAt: new Date() }).where(eq(privacyRequests.id, claimed.id))
    throw error
  }
}

export async function finalizeExpiredPrivacyRetentions(now = new Date()) {
  const db = getDb()
  const expired = await db.query.privacyRequests.findMany({
    where: and(
      eq(privacyRequests.requestType, "deletion"),
      eq(privacyRequests.status, "awaiting_retention"),
      lte(privacyRequests.retentionUntil, now),
    ),
  })
  let completed = 0
  for (const request of expired) {
    await withTransaction(db, async (tx) => {
      const [updated] = await tx.update(privacyRequests).set({
        status: "completed",
        legalHoldReason: null,
        completedAt: now,
        failureReason: null,
      }).where(and(
        eq(privacyRequests.id, request.id),
        eq(privacyRequests.status, "awaiting_retention"),
        lte(privacyRequests.retentionUntil, now),
      )).returning()
      if (!updated) return
      await appendSystemEvents(tx, request, "privacy.deletion_retention_completed", {
        retentionUntil: request.retentionUntil?.toISOString() ?? null,
      })
      completed += 1
    })
  }
  return { completed }
}
