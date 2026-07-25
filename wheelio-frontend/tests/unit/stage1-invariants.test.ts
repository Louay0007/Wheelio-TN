import { describe, expect, it } from "vitest"
import {
  hashLicenseNumber,
  maskLicenseNumber,
} from "@/server/modules/customers/infrastructure/driver-repository"
import { localeSchema } from "@/server/contracts/pagination"
import {
  commissionFromBps,
  millimesFromTnd,
} from "@/server/contracts/money"

describe("licence masking", () => {
  it("masks all but last four characters", () => {
    expect(maskLicenseNumber("TN-1234-8842")).toBe("••••-8842")
  })

  it("hashes normalized licence numbers stably", () => {
    expect(hashLicenseNumber("tn 1234")).toBe(hashLicenseNumber("TN1234"))
  })
})

describe("locale gate", () => {
  it("accepts only en and fr", () => {
    expect(localeSchema.safeParse("en").success).toBe(true)
    expect(localeSchema.safeParse("fr").success).toBe(true)
    expect(localeSchema.safeParse("ar").success).toBe(false)
    expect(localeSchema.safeParse("de").success).toBe(false)
  })
})

describe("deposit exclusion invariant", () => {
  it("never includes deposit in commissionable GMV", () => {
    const rental = millimesFromTnd("100.000")
    const fees = millimesFromTnd("10.000")
    const deposit = millimesFromTnd("500.000")
    const commissionable = rental + fees
    const commission = commissionFromBps(commissionable, 1200)
    expect(commissionable).toBe(BigInt(110_000))
    expect(commission).toBe(BigInt(13_200))
    // Deposit must remain outside GMV/commission math.
    expect(commissionable + deposit).not.toBe(commissionable)
    expect(commissionFromBps(commissionable + deposit, 1200)).not.toBe(commission)
  })
})
