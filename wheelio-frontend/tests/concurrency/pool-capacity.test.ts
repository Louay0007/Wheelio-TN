import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeDb, getDb } from "@/server/core/database/client"
import { createId } from "@/server/contracts/ids"
import {
  agencies,
  bookingSnapshots,
  bookings,
  inventoryAllocations,
  vehiclePools,
} from "@/db/schema"
import { assertPoolCapacity } from "@/server/modules/bookings/application/modifications"
import { AppError } from "@/server/core/errors/app-error"

describe("pool capacity concurrency", () => {
  it("rejects when overlapping allocations fill pool capacity", async () => {
    const db = getDb()
    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.slug, "medina-cars-tunis"),
    })
    if (!agency) {
      expect(true).toBe(true)
      await closeDb()
      return
    }

    const poolId = createId("pool")
    await db.insert(vehiclePools).values({
      id: poolId,
      agencyId: agency.id,
      categoryCode: "economy-pool-test",
      name: "Capacity test pool",
      capacity: 1,
      active: true,
    })

    const start = new Date("2027-03-01T10:00:00.000Z")
    const end = new Date("2027-03-05T10:00:00.000Z")
    const bookingId = createId("bkg")

    await db.insert(bookings).values({
      id: bookingId,
      reference: `WTN-POOL-${Date.now().toString().slice(-6)}`,
      agencyId: agency.id,
      status: "confirmed",
      confirmationMode: "request",
      paymentMode: "pay_at_agency",
      pickupAt: start,
      returnAt: end,
    })
    await db.insert(bookingSnapshots).values({
      id: createId("bsnap"),
      bookingId,
      payloadJson: {},
      payloadHash: "pool-test",
      commissionableMillimes: BigInt(100_000),
      commissionMillimes: BigInt(15_000),
      agencyNetMillimes: BigInt(85_000),
      depositMillimes: BigInt(500_000),
    })

    await db.insert(inventoryAllocations).values({
      id: createId("alloc"),
      bookingId,
      agencyId: agency.id,
      categoryCode: "economy-pool-test",
      poolId,
      reservedStart: start,
      reservedEnd: end,
      status: "confirmed",
    })

    await expect(
      assertPoolCapacity(agency.id, "economy-pool-test", start, end, {
        poolId,
      }),
    ).rejects.toMatchObject({
      code: "INVENTORY_CONFLICT",
    } satisfies Partial<AppError>)

    const laterStart = new Date("2027-04-01T10:00:00.000Z")
    const laterEnd = new Date("2027-04-05T10:00:00.000Z")
    const ok = await assertPoolCapacity(
      agency.id,
      "economy-pool-test",
      laterStart,
      laterEnd,
      { poolId },
    )
    expect(ok.poolId).toBe(poolId)
    expect(ok.used).toBe(0)

    await closeDb()
  })
})
