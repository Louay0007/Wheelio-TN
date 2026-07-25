import { describe, expect, it } from "vitest"
import { ACTIVE_PRIVACY_STATUSES, isRecentAuthentication, serializePrivacyRequest } from "@/server/modules/customers/application/privacy"
import { privacyDeletionRetention } from "@/server/modules/customers/application/privacy-worker"

describe("privacy workflow invariants", () => {
  it("requires authentication no older than fifteen minutes", () => {
    const now = new Date("2026-07-24T12:00:00Z")
    expect(isRecentAuthentication(new Date("2026-07-24T11:45:00Z"), now)).toBe(true)
    expect(isRecentAuthentication(new Date("2026-07-24T11:44:59Z"), now)).toBe(false)
    expect(isRecentAuthentication(null, now)).toBe(false)
  })

  it("treats retained deletions as active to prevent duplicates", () => {
    expect(ACTIVE_PRIVACY_STATUSES).toContain("awaiting_retention")
    expect(ACTIVE_PRIVACY_STATUSES).toContain("processing")
  })

  it("only exposes an artifact after completion", () => {
    const base = { id: "priv_1", customerProfileId: "cus_1", requestType: "export", dueAt: null, legalHoldReason: null, artifactObjectId: "obj_1", failureReason: null, processingStartedAt: null, artifactExpiresAt: null, retentionUntil: null, createdAt: new Date(), completedAt: null }
    expect(serializePrivacyRequest({ ...base, status: "processing" }).artifactReady).toBe(false)
    expect(serializePrivacyRequest({ ...base, status: "completed" }).artifactReady).toBe(true)
  })

  it("stages booking-linked deletion for seven-year retention", () => {
    const now = new Date("2026-07-24T12:00:00Z")
    expect(privacyDeletionRetention(false, now)).toBeNull()
    expect(privacyDeletionRetention(true, now)?.toISOString()).toBe("2033-07-22T12:00:00.000Z")
  })
})
