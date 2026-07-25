import { describe, expect, it } from "vitest";
import { requireCsrfProtection } from "@/server/core/http/csrf";

describe("CSRF protection", () => {
  it("allows safe requests without an Origin header", () => {
    expect(() =>
      requireCsrfProtection(new Request("https://wheelio.test/api/v1/me")),
    ).not.toThrow();
  });

  it("allows same-origin browser writes", () => {
    expect(() =>
      requireCsrfProtection(
        new Request("https://wheelio.test/api/v1/account/profile", {
          method: "PATCH",
          headers: {
            cookie: "session=one",
            origin: "https://wheelio.test",
            "sec-fetch-site": "same-origin",
          },
        }),
      ),
    ).not.toThrow();
  });

  it("rejects cross-origin writes", () => {
    expect(() =>
      requireCsrfProtection(
        new Request("https://wheelio.test/api/v1/account/profile", {
          method: "PATCH",
          headers: {
            cookie: "session=one",
            origin: "https://attacker.test",
            "sec-fetch-site": "cross-site",
          },
        }),
      ),
    ).toThrow(/Cross-site/);
  });

  it("does not trust spoofed forwarded origins", () => {
    expect(() =>
      requireCsrfProtection(
        new Request("https://wheelio.test/api/v1/account/profile", {
          method: "PATCH",
          headers: {
            cookie: "session=one",
            origin: "https://attacker.test",
            "sec-fetch-site": "same-origin",
            "x-forwarded-host": "attacker.test",
            "x-forwarded-proto": "https",
          },
        }),
      ),
    ).toThrow(/Cross-origin/);
  });

  it("requires Origin for cookie-authenticated writes", () => {
    expect(() =>
      requireCsrfProtection(
        new Request("https://wheelio.test/api/v1/account/profile", {
          method: "PATCH",
          headers: { cookie: "session=one" },
        }),
      ),
    ).toThrow(/Origin/);
  });

  it("permits non-browser writes without cookies", () => {
    expect(() =>
      requireCsrfProtection(
        new Request("https://wheelio.test/api/v1/account/profile", {
          method: "PATCH",
          headers: { authorization: "Bearer service-token" },
        }),
      ),
    ).not.toThrow();
  });
});
