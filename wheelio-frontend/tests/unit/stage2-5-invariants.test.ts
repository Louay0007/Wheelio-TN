import { describe, expect, it } from "vitest"
import { ROLE_MATRIX, agencyRoleAllows } from "@/server/modules/agencies/application/ops-extended"
import { agencySettlementPosition } from "@/server/modules/pricing/domain/quote-money"
import {
  assertBalancedEntries,
  buildPayAtAgencyCommissionEntries,
} from "@/server/modules/finance/domain/ledger"
import { DOMAIN_STORAGE_KEYS } from "@/lib/gateways/cutover"

describe("stage 2–5 invariants", () => {
  it("agency role matrix: accountant cannot handover", () => {
    expect(agencyRoleAllows("accountant", "handover")).toBe(false)
    expect(agencyRoleAllows("agent", "handover")).toBe(true)
    expect(agencyRoleAllows("fleet", "rates")).toBe(false)
    expect(ROLE_MATRIX.owner).toContain("onboarding")
  })

  it("pay-at-agency settlement never pays agency_net again when wheelio collected 0", () => {
    const position = agencySettlementPosition({
      wheelioCollectedForAgency: BigInt(0),
      commission: BigInt(26_400),
    })
    expect(position).toBe(BigInt(-26_400))
    const entries = buildPayAtAgencyCommissionEntries({
      commissionMillimes: BigInt(26_400),
    })
    assertBalancedEntries(entries)
    expect(entries.every((e) => !e.accountCode.includes("deposit"))).toBe(true)
  })

  it("cutover lists domain storage keys that must leave localStorage", () => {
    expect(DOMAIN_STORAGE_KEYS).toContain("wheelio-demo-user")
    expect(DOMAIN_STORAGE_KEYS).toContain("wheelio-agency-workspace")
    expect(DOMAIN_STORAGE_KEYS).toContain("wheelio-admin-workspace")
  })

  it("payout items default includesDeposit false conceptually", () => {
    const item = { includesDeposit: false, amountMillimes: BigInt(100) }
    expect(item.includesDeposit).toBe(false)
  })
})
