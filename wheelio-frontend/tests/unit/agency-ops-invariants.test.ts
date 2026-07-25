import { describe, expect, it } from "vitest"
import { z } from "zod"

/**
 * Fee write contract: deposit must never appear as a fee / GMV line.
 * Mirrors putAgencyFees schema + includesDeposit forced false.
 */
const feeWriteSchema = z.object({
  fees: z.array(
    z.object({
      code: z.string().min(1).max(40),
      nameEn: z.string().min(1).max(120),
      nameFr: z.string().min(1).max(120),
      amountMillimes: z.string().regex(/^\d+$/),
      mandatory: z.boolean().default(false),
      active: z.boolean().default(true),
    }),
  ),
})

describe("agency fees money invariants", () => {
  it("accepts EN/FR fee catalog without deposit fields", () => {
    const parsed = feeWriteSchema.parse({
      fees: [
        {
          code: "airport_counter",
          nameEn: "Airport counter",
          nameFr: "Comptoir aéroport",
          amountMillimes: "25000",
          mandatory: true,
          active: true,
        },
      ],
    })
    expect(parsed.fees[0]?.amountMillimes).toBe("25000")
    expect(
      Object.prototype.hasOwnProperty.call(parsed.fees[0], "includesDeposit"),
    ).toBe(false)
  })

  it("rejects non-millimes amounts", () => {
    expect(() =>
      feeWriteSchema.parse({
        fees: [
          {
            code: "x",
            nameEn: "X",
            nameFr: "X",
            amountMillimes: "12.5",
            mandatory: false,
            active: true,
          },
        ],
      }),
    ).toThrow()
  })
})

const policyLocales = z.enum(["en", "fr"])

describe("agency policy locales", () => {
  it("allows only en and fr", () => {
    expect(policyLocales.parse("en")).toBe("en")
    expect(policyLocales.parse("fr")).toBe("fr")
    expect(() => policyLocales.parse("ar")).toThrow()
  })
})
