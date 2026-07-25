import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const localeSchema = z.enum(["en", "fr"]);
export type AppLocale = z.infer<typeof localeSchema>;

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  after: z.string().min(1).optional(),
});

export type PageMeta = {
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount?: number;
};

function cursorSignature(payload: string) {
  const secret =
    process.env.BETTER_AUTH_SECRET ??
    (process.env.NODE_ENV === "production"
      ? null
      : "wheelio-test-cursor-secret");
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required for cursors");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function encodeCursor(parts: Record<string, string | number>) {
  const payload = Buffer.from(JSON.stringify(parts), "utf8").toString(
    "base64url",
  );
  return `${payload}.${cursorSignature(payload)}`;
}

export function decodeCursor<T extends Record<string, string | number>>(
  cursor: string,
): T | null {
  try {
    const [payload, signature, extra] = cursor.split(".");
    if (!payload || !signature || extra) return null;
    const expected = cursorSignature(payload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    )
      return null;
    const raw = Buffer.from(payload, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return null;
    return parsed as T;
  } catch {
    return null;
  }
}
