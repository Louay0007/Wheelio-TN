import { describe, expect, it } from "vitest"
import {
  assertBalancedEntries,
  buildPayAtAgencyCommissionEntries,
  filterGmvAccounts,
} from "@/server/modules/finance/domain/ledger"
import { millimesFromTnd } from "@/server/contracts/money"

describe("ledger invariants", () => {
  it("requires balanced double-entry", () => {
    expect(() =>
      assertBalancedEntries([
        { accountCode: "a", debitMillimes: BigInt(100) },
        { accountCode: "b", creditMillimes: BigInt(90) },
      ]),
    ).toThrow(/Unbalanced/)
  })

  it("pay-at-agency posts commission receivable only", () => {
    const commission = millimesFromTnd("26.400")
    const entries = buildPayAtAgencyCommissionEntries({
      commissionMillimes: commission,
    })
    assertBalancedEntries(entries)
    expect(entries.some((e) => e.accountCode.includes("deposit"))).toBe(false)
  })

  it("filters deposit accounts out of GMV views", () => {
    const filtered = filterGmvAccounts([
      { accountCode: "gmv.rental", debitMillimes: BigInt(1) },
      { accountCode: "agency.deposit_liability", creditMillimes: BigInt(1) },
    ])
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.accountCode).toBe("gmv.rental")
  })
})
