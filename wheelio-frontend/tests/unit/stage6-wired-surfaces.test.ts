import { describe, expect, it } from "vitest"
import {
  DOMAIN_STORAGE_KEYS,
  UNWIRED_EMPTY_STATE_SURFACES,
  WIRED_ADMIN_SURFACES,
  WIRED_AGENCY_SURFACES,
} from "@/lib/gateways/cutover"
import { hashTaxId } from "@/server/modules/partners/application/admin-applications"

describe("stage 6 wired vs empty-state inventory", () => {
  it("lists high-value wired agency/admin surfaces", () => {
    expect(WIRED_AGENCY_SURFACES).toContain("inbox")
    expect(WIRED_AGENCY_SURFACES).toContain("fleet.detail")
    expect(WIRED_AGENCY_SURFACES).toContain("fleet.photos")
    expect(WIRED_AGENCY_SURFACES).toContain("policies")
    expect(WIRED_AGENCY_SURFACES).toContain("rates.fees")
    expect(WIRED_AGENCY_SURFACES).toContain("notifications")
    expect(WIRED_ADMIN_SURFACES).toContain("applications")
    expect(WIRED_ADMIN_SURFACES).toContain("cases.detail")
    expect(WIRED_ADMIN_SURFACES).toContain("bookings.money")
    expect(WIRED_ADMIN_SURFACES).toContain("bookings.messages")
  })

  it("Priority A surfaces are no longer ApiNotWiredEmpty placeholders", () => {
    expect(UNWIRED_EMPTY_STATE_SURFACES).toHaveLength(0)
    expect(UNWIRED_EMPTY_STATE_SURFACES).not.toContain("agency.fleet.photos")
    expect(UNWIRED_EMPTY_STATE_SURFACES).not.toContain("admin.bookings.messages")
    expect(UNWIRED_EMPTY_STATE_SURFACES).not.toContain("applications")
  })

  it("cutover deny list still covers partner application drafts", () => {
    expect(DOMAIN_STORAGE_KEYS).toContain("wheelio-partner-application")
  })

  it("tax id hashing is deterministic and not reversible plaintext", () => {
    const a = hashTaxId("1234567/A/M/000")
    const b = hashTaxId("1234567/a/m/000")
    expect(a).toBe(b)
    expect(a).toHaveLength(64)
    expect(a).not.toContain("1234567")
  })
})
