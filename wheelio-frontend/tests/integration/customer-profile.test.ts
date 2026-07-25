import { describe, expect, it } from "vitest"
import { updateCustomerProfileSchema } from "@/server/modules/customers/contracts/profile"

describe("customer profile contract", () => {
  it("requires version for optimistic concurrency", () => {
    const parsed = updateCustomerProfileSchema.safeParse({
      legalName: "Ada",
      preferredLocale: "en",
    })
    expect(parsed.success).toBe(false)
  })

  it("rejects unsupported locales", () => {
    const parsed = updateCustomerProfileSchema.safeParse({
      version: 1,
      preferredLocale: "ar",
    })
    expect(parsed.success).toBe(false)
  })

  it("accepts en/fr updates", () => {
    const parsed = updateCustomerProfileSchema.safeParse({
      version: 1,
      preferredLocale: "fr",
      theme: "dark",
    })
    expect(parsed.success).toBe(true)
  })
})
