import { forbidden } from "@/server/core/errors/app-error";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function normalizedOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function allowedOrigins(request: Request) {
  const values = new Set<string>();
  for (const configured of [
    process.env.APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    if (!configured) continue;
    const origin = normalizedOrigin(configured);
    if (origin) values.add(origin);
  }
  if (values.size === 0 && process.env.NODE_ENV !== "production") {
    values.add(new URL(request.url).origin);
  }
  return values;
}

export function requireCsrfProtection(request: Request) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw forbidden("FORBIDDEN", "Cross-site API writes are not allowed");
  }

  const origin = request.headers.get("origin");
  const hasSessionCookie = request.headers.has("cookie");
  if (!origin) {
    if (hasSessionCookie) {
      throw forbidden(
        "FORBIDDEN",
        "An Origin header is required for this write",
      );
    }
    return;
  }

  const normalized = normalizedOrigin(origin);
  if (!normalized || !allowedOrigins(request).has(normalized)) {
    throw forbidden("FORBIDDEN", "Cross-origin API writes are not allowed");
  }
}
