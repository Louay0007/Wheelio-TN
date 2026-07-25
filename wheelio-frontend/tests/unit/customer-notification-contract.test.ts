import { describe, expect, it } from "vitest"
import { customerNotificationSchema, notificationReadAckSchema } from "@/lib/contracts/account"
import { decodeCursor, encodeCursor } from "@/server/contracts/pagination"

describe("customer notification contracts", () => {
  it("accepts localized inbox rows and read commands", () => {
    expect(customerNotificationSchema.parse({ id: "ntf_1", type: "booking.confirmed", title: "Confirmed", body: "Ready", href: "/trips/1", metadata: {}, readAt: null, createdAt: "2026-07-24T12:00:00.000Z" }).id).toBe("ntf_1")
    expect(notificationReadAckSchema.parse({ id: "ntf_1", readAt: "2026-07-24T12:01:00.000Z" }).readAt).not.toBeNull()
  })
  it("signs compound feed cursors", () => {
    const value = { at: "2026-07-24T12:00:00.000Z", id: "ntf_1" }
    expect(decodeCursor(encodeCursor(value))).toEqual(value)
  })
})
