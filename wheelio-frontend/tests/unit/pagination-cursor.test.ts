import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "@/server/contracts/pagination";

describe("pagination cursors", () => {
  it("round-trips signed cursor payloads", () => {
    const cursor = encodeCursor({
      createdAt: "2026-07-24T00:00:00.000Z",
      id: "one",
    });
    expect(decodeCursor(cursor)).toEqual({
      createdAt: "2026-07-24T00:00:00.000Z",
      id: "one",
    });
  });

  it("rejects tampered cursors", () => {
    const cursor = encodeCursor({ id: "one" });
    expect(decodeCursor(`${cursor}x`)).toBeNull();
  });
});
