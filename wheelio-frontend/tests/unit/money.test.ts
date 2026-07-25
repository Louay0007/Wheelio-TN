import { describe, expect, it } from "vitest"
import {
  commissionFromBps,
  millimesFromTnd,
  moneyDto,
} from "@/server/contracts/money"
import { createRequestId } from "@/server/contracts/ids"
import { encodeCursor, decodeCursor } from "@/server/contracts/pagination"

describe("money contracts", () => {
  it("converts TND to millimes", () => {
    expect(millimesFromTnd("12.345")).toBe(BigInt(12345))
    expect(millimesFromTnd(1)).toBe(BigInt(1000))
    expect(millimesFromTnd("-0.5")).toBe(BigInt(-500))
  })

  it("serializes money dto as string millimes", () => {
    expect(moneyDto(BigInt(2500))).toEqual({
      amountMillimes: "2500",
      currency: "TND",
    })
  })

  it("rounds commission half-up in basis points", () => {
    expect(commissionFromBps(BigInt(10000), 1250)).toBe(BigInt(1250))
    expect(commissionFromBps(BigInt(1), 5000)).toBe(BigInt(1))
    expect(commissionFromBps(BigInt(1), 4999)).toBe(BigInt(0))
  })
})

describe("ids and pagination", () => {
  it("creates opaque request ids", () => {
    expect(createRequestId().startsWith("req_")).toBe(true)
  })

  it("round-trips cursors", () => {
    const encoded = encodeCursor({ id: "abc", n: 2 })
    expect(decodeCursor<{ id: string; n: number }>(encoded)).toEqual({
      id: "abc",
      n: 2,
    })
  })
})
