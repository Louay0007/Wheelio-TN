import { describe, expect, it } from "vitest"
import {
  agencySettlementPosition,
  buildQuoteBreakdown,
  createBookingReference,
} from "@/server/modules/pricing/domain/quote-money"
import { millimesFromTnd } from "@/server/contracts/money"

describe("quote money invariants", () => {
  it("keeps deposit outside commissionable GMV", () => {
    const breakdown = buildQuoteBreakdown({
      rentalMillimes: millimesFromTnd("200"),
      mandatoryFeesMillimes: millimesFromTnd("20"),
      extrasMillimes: millimesFromTnd("15"),
      depositMillimes: millimesFromTnd("800"),
      commissionRateBps: 1200,
      paymentMode: "pay_at_agency",
    })
    expect(breakdown.commissionable.amountMillimes).toBe("220000")
    expect(breakdown.commission.amountMillimes).toBe("26400")
    expect(breakdown.agencyNet.amountMillimes).toBe("193600")
    expect(breakdown.deskDue.amountMillimes).toBe("235000")
    expect(breakdown.onlineDue.amountMillimes).toBe("0")
    expect(breakdown.deposit.amountMillimes).toBe("800000")
  })

  it("pay-at-agency produces commission receivable, not agency payout", () => {
    const commission = millimesFromTnd("26.400")
    // Agency collected full customer total at desk; Wheelio collected nothing.
    const position = agencySettlementPosition({
      wheelioCollectedForAgency: BigInt(0),
      commission,
    })
    expect(position).toBe(-commission)
  })

  it("formats booking references", () => {
    expect(createBookingReference(881001)).toBe("WTN-881001")
  })
})
