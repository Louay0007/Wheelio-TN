import { describe, expect, it } from "vitest"
import { isRecentAuthentication, RECENT_AUTH_MS } from "@/server/core/security/guards"

describe("recent authentication guard", () => {
  const now = new Date("2026-07-25T12:00:00.000Z")

  it("accepts authentication at the boundary", () => {
    expect(isRecentAuthentication(new Date(now.getTime() - RECENT_AUTH_MS), now)).toBe(true)
  })

  it("rejects stale, future, and absent authentication", () => {
    expect(isRecentAuthentication(new Date(now.getTime() - RECENT_AUTH_MS - 1), now)).toBe(false)
    expect(isRecentAuthentication(new Date(now.getTime() + 1), now)).toBe(false)
    expect(isRecentAuthentication(null, now)).toBe(false)
  })
})
