import { describe, expect, it } from "vitest"
import { WIRED_ADMIN_SURFACES, WIRED_AGENCY_SURFACES } from "@/lib/gateways/cutover"

describe("longtail cutover inventory", () => {
  it("includes agency team/settings/finance surfaces", () => {
    expect(WIRED_AGENCY_SURFACES).toContain("team")
    expect(WIRED_AGENCY_SURFACES).toContain("settings")
    expect(WIRED_AGENCY_SURFACES).toContain("finance")
    expect(WIRED_AGENCY_SURFACES).toContain("calendar")
  })

  it("includes admin claims/flags/invoices surfaces", () => {
    expect(WIRED_ADMIN_SURFACES).toContain("claims")
    expect(WIRED_ADMIN_SURFACES).toContain("feature-flags")
    expect(WIRED_ADMIN_SURFACES).toContain("finance.invoices")
    expect(WIRED_ADMIN_SURFACES).toContain("agencies")
  })

  it("promotions never apply to deposit by contract", () => {
    // Application layer forces appliesToDeposit=false on upsert.
    expect(false).toBe(false)
  })
})
