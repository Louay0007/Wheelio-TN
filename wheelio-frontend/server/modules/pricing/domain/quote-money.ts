import { createHash } from "node:crypto"
import { commissionFromBps, moneyDto, type MoneyDto } from "@/server/contracts/money"

export type QuoteMoneyBreakdown = {
  rental: MoneyDto
  mandatoryFees: MoneyDto
  extras: MoneyDto
  discount: MoneyDto
  commissionable: MoneyDto
  agencyNet: MoneyDto
  commission: MoneyDto
  onlineDue: MoneyDto
  deskDue: MoneyDto
  /** Always separate from GMV/commissionable. */
  deposit: MoneyDto
}

export function buildQuoteBreakdown(input: {
  rentalMillimes: bigint
  mandatoryFeesMillimes: bigint
  extrasMillimes?: bigint
  discountMillimes?: bigint
  depositMillimes?: bigint
  commissionRateBps: number
  paymentMode: "deposit_online" | "pay_at_agency"
}): QuoteMoneyBreakdown {
  const extras = input.extrasMillimes ?? BigInt(0)
  const discount = input.discountMillimes ?? BigInt(0)
  const deposit = input.depositMillimes ?? BigInt(0)
  const commissionable =
    input.rentalMillimes + input.mandatoryFeesMillimes - discount
  if (commissionable < BigInt(0)) {
    throw new Error("commissionable cannot be negative")
  }
  const commission = commissionFromBps(commissionable, input.commissionRateBps)
  const agencyNet = commissionable - commission
  const customerTotal = commissionable + extras
  const onlineDue =
    input.paymentMode === "deposit_online" ? customerTotal : BigInt(0)
  const deskDue =
    input.paymentMode === "pay_at_agency" ? customerTotal : BigInt(0)

  return {
    rental: moneyDto(input.rentalMillimes),
    mandatoryFees: moneyDto(input.mandatoryFeesMillimes),
    extras: moneyDto(extras),
    discount: moneyDto(discount),
    commissionable: moneyDto(commissionable),
    agencyNet: moneyDto(agencyNet),
    commission: moneyDto(commission),
    onlineDue: moneyDto(onlineDue),
    deskDue: moneyDto(deskDue),
    deposit: moneyDto(deposit),
  }
}

/**
 * Pay-at-agency settlement: agency already holds customer funds and owes Wheelio commission.
 * Never pay agency_net again as a Wheelio→agency payout.
 */
export function agencySettlementPosition(input: {
  wheelioCollectedForAgency: bigint
  commission: bigint
  agencyClawbacks?: bigint
  wheelioFundedAdjustments?: bigint
}): bigint {
  const clawbacks = input.agencyClawbacks ?? BigInt(0)
  const adjustments = input.wheelioFundedAdjustments ?? BigInt(0)
  return (
    input.wheelioCollectedForAgency -
    input.commission -
    clawbacks +
    adjustments
  )
}

export function hashSnapshotPayload(payload: Record<string, unknown>) {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
}

export function createBookingReference(seq: number) {
  const padded = String(seq).padStart(6, "0")
  return `WTN-${padded}`
}
