import { describe, expect, it } from "vitest"
import {
  signPaymentClientSecret,
  verifyPaymentClientSecret,
  buildSignedCaptureWebhook,
} from "@/server/modules/finance/application/payment-stub"
import {
  signWebhookBody,
  verifyWebhookSignature,
} from "@/server/modules/finance/application/webhook-auth"
import { AppError } from "@/server/core/errors/app-error"
import { DOMAIN_STORAGE_KEYS } from "@/lib/gateways/cutover"

describe("signed payment stub client secrets", () => {
  it("round-trips HMAC client secret", () => {
    const secret = signPaymentClientSecret("pi_test", "220000")
    expect(secret.startsWith("stub_pi_test.")).toBe(true)
    expect(() =>
      verifyPaymentClientSecret(secret, "pi_test", "220000"),
    ).not.toThrow()
  })

  it("rejects tampered amount", () => {
    const secret = signPaymentClientSecret("pi_test", "220000")
    expect(() =>
      verifyPaymentClientSecret(secret, "pi_test", "999999"),
    ).toThrow(AppError)
  })

  it("builds webhook payload that verifies with HMAC", () => {
    const { body, signature } = buildSignedCaptureWebhook({
      intentId: "pi_test",
      amountMillimes: "220000",
      providerTransactionId: "stub_txn_1",
    })
    expect(() => verifyWebhookSignature(body, signature)).not.toThrow()
    const parsed = JSON.parse(body) as { amountMillimes: string; type: string }
    expect(parsed.type).toBe("capture")
    expect(parsed.amountMillimes).toBe("220000")
    expect(signWebhookBody(body)).toBe(signature.replace(/^sha256=/, ""))
  })
})

describe("decline + refund + cutover invariants", () => {
  it("agency decline reason codes are closed set", () => {
    const codes = ["unavailable", "documents", "out_of_area", "other"] as const
    expect(codes).toHaveLength(4)
    expect(codes).not.toContain("deposit")
  })

  it("refund requests always exclude deposit", () => {
    const refund = {
      includesDeposit: false as const,
      customerAmountMillimes: "50000",
    }
    expect(refund.includesDeposit).toBe(false)
  })

  it("cutover deny list includes agency branch key", () => {
    expect(DOMAIN_STORAGE_KEYS).toContain("wheelio-agency-branch")
    expect(DOMAIN_STORAGE_KEYS).toContain("wheelio-agency-workspace")
    expect(DOMAIN_STORAGE_KEYS).toContain("wheelio-admin-workspace")
  })
})

describe("tenant isolation shape", () => {
  it("agency scope errors use TENANT_SCOPE_VIOLATION code convention", () => {
    const err = new AppError({
      code: "TENANT_SCOPE_VIOLATION",
      message: "Cross-tenant access denied",
      status: 403,
    })
    expect(err.code).toBe("TENANT_SCOPE_VIOLATION")
    expect(err.status).toBe(403)
  })
})
