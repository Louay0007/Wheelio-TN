import { describe, expect, it } from "vitest"
import {
  signWebhookBody,
  verifyWebhookSignature,
} from "@/server/modules/finance/application/webhook-auth"
import { AppError } from "@/server/core/errors/app-error"
import { agencySettlementPosition } from "@/server/modules/pricing/domain/quote-money"
import {
  assertBalancedEntries,
  buildPayAtAgencyCommissionEntries,
} from "@/server/modules/finance/domain/ledger"

describe("payment webhook HMAC", () => {
  it("accepts matching sha256 signature", () => {
    const body = JSON.stringify({ intentId: "pi_1", type: "capture" })
    const sig = `sha256=${signWebhookBody(body)}`
    expect(() => verifyWebhookSignature(body, sig)).not.toThrow()
  })

  it("rejects bad signature", () => {
    expect(() => verifyWebhookSignature("{}", "sha256=00")).toThrow(AppError)
  })

  it("rejects missing signature", () => {
    expect(() => verifyWebhookSignature("{}", null)).toThrow(AppError)
  })
})

describe("deposit-absent payout invariants", () => {
  it("never folds deposit into settlement position", () => {
    const agencyNet = BigInt(500_000)
    const depositMemo = BigInt(1_000_000)
    const position = agencySettlementPosition({
      wheelioCollectedForAgency: agencyNet,
      commission: BigInt(0),
    })
    expect(position).toBe(agencyNet)
    expect(position).not.toBe(agencyNet + depositMemo)
  })

  it("pay-at-agency posts commission receivable without agency_net payout", () => {
    const entries = buildPayAtAgencyCommissionEntries({
      commissionMillimes: BigInt(26_400),
    })
    assertBalancedEntries(entries)
    expect(entries.some((e) => e.accountCode.includes("payable_net"))).toBe(
      false,
    )
    expect(entries.some((e) => e.accountCode.includes("deposit"))).toBe(false)
  })
})
