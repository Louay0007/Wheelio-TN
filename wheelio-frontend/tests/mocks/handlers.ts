import { http, HttpResponse } from "msw"
import {
  agencyFixture,
  bootstrapFixture,
  locationFixture,
  reviewFixture,
} from "@/tests/mocks/fixtures/public-catalog"

const meta = { requestId: "req_test", locale: "en" as const }
const page = { nextCursor: null, hasMore: false }

export const handlers = [
  http.get("*/api/v1/public/bootstrap", () =>
    HttpResponse.json({ data: bootstrapFixture, meta }),
  ),
  http.get("*/api/v1/public/locations", () =>
    HttpResponse.json({ data: [locationFixture], page, meta }),
  ),
  http.get("*/api/v1/public/agencies", () =>
    HttpResponse.json({ data: [agencyFixture], page, meta }),
  ),
  http.get("*/api/v1/public/reviews", () =>
    HttpResponse.json({ data: [reviewFixture], page, meta }),
  ),
]
