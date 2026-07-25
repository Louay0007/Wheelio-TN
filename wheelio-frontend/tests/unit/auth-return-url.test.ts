import { describe, expect, it } from "vitest"
import { safeAuthReturnUrl } from "@/components/auth-form"

describe("auth return URL", () => {
  it("accepts encoded internal paths", () => {
    expect(safeAuthReturnUrl("%2Faccount%2Fsecurity")).toBe(
      "/account/security",
    )
  })

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeAuthReturnUrl("https%3A%2F%2Fevil.test")).toBe("/account")
    expect(safeAuthReturnUrl("%2F%2Fevil.test")).toBe("/account")
  })

  it("falls back for invalid encoding", () => {
    expect(safeAuthReturnUrl("%E0%A4%A")).toBe("/account")
  })
})
