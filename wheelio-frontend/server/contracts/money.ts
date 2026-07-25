import { z } from "zod"

export const currencySchema = z.literal("TND")

export const moneySchema = z.object({
  amountMillimes: z.string().regex(/^-?\d+$/),
  currency: currencySchema,
})

export type MoneyDto = z.infer<typeof moneySchema>

export const MILLIMES_PER_TND = BigInt(1000)

export function millimesFromTnd(amount: number | string): bigint {
  const normalized =
    typeof amount === "number" ? amount.toFixed(3) : amount.trim()
  const negative = normalized.startsWith("-")
  const absolute = negative ? normalized.slice(1) : normalized
  const [whole = "0", fraction = ""] = absolute.split(".")
  const padded = `${fraction}000`.slice(0, 3)
  const value = BigInt(whole) * MILLIMES_PER_TND + BigInt(padded)
  return negative ? -value : value
}

export function moneyDto(amountMillimes: bigint, currency: "TND" = "TND"): MoneyDto {
  return {
    amountMillimes: amountMillimes.toString(),
    currency,
  }
}

/** Half-up commission in millimes from basis points. */
export function commissionFromBps(
  commissionableMillimes: bigint,
  rateBps: number,
): bigint {
  if (rateBps < 0) throw new Error("rateBps must be non-negative")
  const product = commissionableMillimes * BigInt(rateBps)
  const quotient = product / BigInt(10_000)
  const remainder = product % BigInt(10_000)
  return remainder >= BigInt(5000) ? quotient + BigInt(1) : quotient
}
