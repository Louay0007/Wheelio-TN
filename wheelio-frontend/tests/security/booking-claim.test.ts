import { describe, expect, it } from "vitest"
import { hashBookingClaimToken, isClaimUsable } from "@/server/modules/bookings/application/claim-booking"

describe("booking claim token security", () => {
  it("stores a deterministic hash without retaining plaintext", () => {
    const token = "a".repeat(43)
    expect(hashBookingClaimToken(token)).toHaveLength(64)
    expect(hashBookingClaimToken(token)).not.toContain(token)
  })
  it("rejects expiry, replay, and exhausted attempts", () => {
    const now = new Date("2026-07-24T12:00:00Z")
    expect(isClaimUsable({ expiresAt: new Date("2026-07-24T12:01:00Z"), consumedAt: null, attempts: 0, maxAttempts: 5 }, now)).toBe(true)
    expect(isClaimUsable({ expiresAt: now, consumedAt: null, attempts: 0, maxAttempts: 5 }, now)).toBe(false)
    expect(isClaimUsable({ expiresAt: new Date("2026-07-24T12:01:00Z"), consumedAt: now, attempts: 0, maxAttempts: 5 }, now)).toBe(false)
    expect(isClaimUsable({ expiresAt: new Date("2026-07-24T12:01:00Z"), consumedAt: null, attempts: 5, maxAttempts: 5 }, now)).toBe(false)
  })
})
