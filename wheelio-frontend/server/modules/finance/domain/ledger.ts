import { createHash } from "node:crypto"
import { moneyDto, type MoneyDto } from "@/server/contracts/money"

export type LedgerEntryInput = {
  accountCode: string
  debitMillimes?: bigint
  creditMillimes?: bigint
}

export type LedgerTransactionDraft = {
  type: string
  bookingId?: string
  description: string
  idempotencyKey: string
  entries: LedgerEntryInput[]
}

/** Double-entry must net to zero. Deposit accounts are liabilities, never GMV. */
export function assertBalancedEntries(entries: LedgerEntryInput[]) {
  let debit = BigInt(0)
  let credit = BigInt(0)
  for (const entry of entries) {
    debit += entry.debitMillimes ?? BigInt(0)
    credit += entry.creditMillimes ?? BigInt(0)
    if ((entry.debitMillimes ?? BigInt(0)) > BigInt(0) && (entry.creditMillimes ?? BigInt(0)) > BigInt(0)) {
      throw new Error("Entry cannot be both debit and credit")
    }
  }
  if (debit !== credit) {
    throw new Error(`Unbalanced ledger transaction: debit=${debit} credit=${credit}`)
  }
}

export function hashLedgerIdempotency(key: string) {
  return createHash("sha256").update(key).digest("hex")
}

/**
 * Pay-at-agency: agency holds customer funds → Wheelio records commission receivable.
 * Never create a Wheelio→agency payout of agency_net for this mode.
 */
export function buildPayAtAgencyCommissionEntries(input: {
  commissionMillimes: bigint
}): LedgerEntryInput[] {
  return [
    {
      accountCode: "wheelio.commission_receivable",
      debitMillimes: input.commissionMillimes,
    },
    {
      accountCode: "agency.commission_payable",
      creditMillimes: input.commissionMillimes,
    },
  ]
}

export function moneyFromLedger(amount: bigint): MoneyDto {
  return moneyDto(amount)
}

export function isDepositAccount(accountCode: string) {
  return accountCode.includes("deposit")
}

export function filterGmvAccounts(entries: LedgerEntryInput[]) {
  return entries.filter((entry) => !isDepositAccount(entry.accountCode))
}
