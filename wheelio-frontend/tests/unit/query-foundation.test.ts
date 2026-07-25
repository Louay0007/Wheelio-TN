import { describe, expect, it } from "vitest"
import { createQueryClient } from "@/components/providers/query-provider"
import { queryKeys } from "@/lib/query/keys"

describe("query foundation", () => {
  it("creates an isolated client with bounded cache defaults", () => {
    const first = createQueryClient()
    const second = createQueryClient()

    expect(first).not.toBe(second)
    expect(first.getDefaultOptions().queries?.staleTime).toBe(30_000)
    expect(first.getDefaultOptions().mutations?.retry).toBe(false)
  })

  it("partitions public cache entries by locale and filters", () => {
    expect(queryKeys.public.locations("en")).not.toEqual(
      queryKeys.public.locations("fr"),
    )
    expect(queryKeys.public.agencies("en", { city: "Tunis" })).not.toEqual(
      queryKeys.public.agencies("en", { city: "Sousse" }),
    )
  })
})
