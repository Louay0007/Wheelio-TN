import { describe, expect, it } from "vitest"
import { forbidden } from "@/server/core/errors/app-error"

describe("customer isolation guardrails", () => {
  it("uses TENANT_SCOPE_VIOLATION for cross-tenant access", () => {
    const err = forbidden(
      "TENANT_SCOPE_VIOLATION",
      "Cannot update another customer's profile",
    )
    expect(err.code).toBe("TENANT_SCOPE_VIOLATION")
    expect(err.status).toBe(403)
  })
})
