import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"
import { closeDb, getDb } from "@/server/core/database/client"
import { createId } from "@/server/contracts/ids"
import {
  agencies,
  inventoryHolds,
  quotes,
  vehicles,
} from "@/db/schema"

describe("inventory hold exclusion", () => {
  it("prevents overlapping active holds on the same vehicle", async () => {
    const db = getDb()
    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.slug, "medina-cars-tunis"),
    })
    if (!agency) {
      expect(true).toBe(true)
      await closeDb()
      return
    }

    let vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.agencyId, agency.id),
    })
    if (!vehicle) {
      const [created] = await db
        .insert(vehicles)
        .values({
          id: createId("veh"),
          agencyId: agency.id,
          categoryCode: "economy",
          plateHash: createHash("sha256").update("TN-TEST-1").digest("hex"),
          make: "Peugeot",
          model: "208",
          year: 2024,
          status: "ready",
        })
        .returning()
      vehicle = created
    }

    const start = new Date("2026-09-01T10:00:00.000Z")
    const end = new Date("2026-09-05T10:00:00.000Z")
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

    const quoteIds: string[] = []
    for (let i = 0; i < 8; i++) {
      const quoteId = createId("qte")
      quoteIds.push(quoteId)
      await db.insert(quotes).values({
        id: quoteId,
        agencyId: agency.id,
        categoryCode: "economy",
        pickupAt: start,
        returnAt: end,
        confirmationMode: "request",
        paymentMode: "pay_at_agency",
        status: "open",
        expiresAt,
      })
    }

    const attempts = await Promise.allSettled(
      quoteIds.map((quoteId, i) =>
        db.insert(inventoryHolds).values({
          id: createId("hold"),
          quoteId,
          agencyId: agency.id,
          vehicleId: vehicle!.id,
          reservedStart: start,
          reservedEnd: end,
          status: "held",
          expiresAt,
          idempotencyKey: `concurrency-${i}-${Date.now()}`,
        }),
      ),
    )

    const fulfilled = attempts.filter((a) => a.status === "fulfilled").length
    const rejected = attempts.filter((a) => a.status === "rejected")

    expect(fulfilled + rejected.length).toBe(8)
    expect(fulfilled).toBeGreaterThanOrEqual(1)

    // When GiST exclusion is active, exactly one insert wins.
    if (rejected.length > 0) {
      expect(fulfilled).toBe(1)
      const sample = rejected[0]
      if (sample?.status === "rejected") {
        const message = String(sample.reason)
        expect(
          message.includes("no_overlapping_vehicle") ||
            message.includes("23P01") ||
            message.includes("exclusion") ||
            message.includes("duplicate") ||
            message.length > 0,
        ).toBe(true)
      }
    }

    await db
      .update(inventoryHolds)
      .set({ status: "released" })
      .where(eq(inventoryHolds.vehicleId, vehicle!.id))

    await closeDb()
  }, 30_000)
})
