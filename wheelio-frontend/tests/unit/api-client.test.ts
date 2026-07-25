import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { apiFetch, apiFetchCollection } from "@/lib/api/client"
import {
  publicBootstrapSchema,
  publicLocationSchema,
} from "@/lib/contracts/public-catalog"
import { mockApiServer } from "@/tests/mocks/server"

beforeAll(() => mockApiServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mockApiServer.resetHandlers())
afterAll(() => mockApiServer.close())

describe("API client", () => {
  it("validates a successful response envelope", async () => {
    const data = await apiFetch("http://wheelio.test/api/v1/public/bootstrap", {
      schema: publicBootstrapSchema,
    })

    expect(data.locale).toBe("en")
    expect(data.featuredLocations[0]?.slug).toBe("tunis-carthage-airport")
  })

  it("validates collection envelopes", async () => {
    const data = await apiFetchCollection(
      "http://wheelio.test/api/v1/public/locations",
      { itemSchema: publicLocationSchema },
    )

    expect(data).toHaveLength(1)
  })

  it("maps structured API errors", async () => {
    mockApiServer.use(
      http.get("http://wheelio.test/api/v1/public/bootstrap", () =>
        HttpResponse.json(
          {
            error: {
              code: "RATE_LIMITED",
              message: "Try later.",
              requestId: "req_rate",
            },
          },
          { status: 429 },
        ),
      ),
    )

    await expect(
      apiFetch("http://wheelio.test/api/v1/public/bootstrap", {
        schema: publicBootstrapSchema,
      }),
    ).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      requestId: "req_rate",
    })
  })

  it("rejects contract drift", async () => {
    mockApiServer.use(
      http.get("http://wheelio.test/api/v1/public/bootstrap", () =>
        HttpResponse.json({
          data: { locale: "ar" },
          meta: { requestId: "req_invalid" },
        }),
      ),
    )

    await expect(
      apiFetch("http://wheelio.test/api/v1/public/bootstrap", {
        schema: publicBootstrapSchema,
      }),
    ).rejects.toMatchObject({
      status: 502,
      code: "INVALID_API_RESPONSE",
    })
  })
})
