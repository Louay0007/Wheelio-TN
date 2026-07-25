/**
 * Integration placeholders for Stage 0.
 * Full DB-backed suites run when Compose Postgres is available
 * (see tests/integration/*.integration.test.ts in later PRs).
 */
import { describe, expect, it } from "vitest"

describe("auth session contract (scaffold)", () => {
  it("documents required auth base path", () => {
    expect("/api/auth").toMatch(/^\/api\/auth/)
  })
})
