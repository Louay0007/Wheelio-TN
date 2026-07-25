import { describe, expect, it } from "vitest"
import { AppError } from "@/server/core/errors/app-error"
import { hashRequestPayload } from "@/server/core/idempotency/service"

describe("app errors", () => {
  it("exposes client-safe 4xx by default", () => {
    const err = new AppError({
      code: "VALIDATION_ERROR",
      message: "bad",
      status: 422,
    })
    expect(err.expose).toBe(true)
  })

  it("hides 5xx details by default", () => {
    const err = new AppError({
      code: "INTERNAL_ERROR",
      message: "boom",
      status: 500,
    })
    expect(err.expose).toBe(false)
  })
})

describe("idempotency hashing", () => {
  it("is stable across key order", () => {
    const a = hashRequestPayload({ b: 1, a: 2 })
    const b = hashRequestPayload({ a: 2, b: 1 })
    expect(a).toBe(b)
  })

  it("changes when payload changes", () => {
    expect(hashRequestPayload({ a: 1 })).not.toBe(hashRequestPayload({ a: 2 }))
  })
})
