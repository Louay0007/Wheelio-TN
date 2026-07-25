import { describe, expect, it } from "vitest"
import { createRequestContext } from "@/server/core/http/request-context"

describe("request context", () => {
  it("defaults locale to en and accepts fr", async () => {
    const en = await createRequestContext(
      new Headers({ "accept-language": "de-DE,en;q=0.8" }),
    )
    expect(en.locale).toBe("en")

    const fr = await createRequestContext(
      new Headers({ "accept-language": "fr-FR,fr;q=0.9" }),
    )
    expect(fr.locale).toBe("fr")
  })

  it("rejects arabic by falling back to en", async () => {
    const ctx = await createRequestContext(
      new Headers({ "accept-language": "ar-TN,ar;q=0.9" }),
    )
    expect(ctx.locale).toBe("en")
  })

  it("honors valid request ids", async () => {
    const ctx = await createRequestContext(
      new Headers({ "x-request-id": "req_abcdefghijklmnopqrstuvwx" }),
    )
    expect(ctx.requestId).toBe("req_abcdefghijklmnopqrstuvwx")
  })
})
