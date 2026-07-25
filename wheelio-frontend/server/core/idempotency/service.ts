import { createHash } from "node:crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { idempotencyKeys } from "@/db/schema";
import { createId } from "@/server/contracts/ids";
import { conflict } from "@/server/core/errors/app-error";
import type { Database } from "@/server/core/database/client";
import type { DbTransaction } from "@/server/core/database/transaction";

type IdempotencyTx = Database | DbTransaction;

export function hashRequestPayload(payload: unknown) {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

export async function beginIdempotency(opts: {
  db: IdempotencyTx;
  principalKey: string;
  scope: string;
  key: string;
  requestHash: string;
  ttlSeconds?: number;
}) {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (opts.ttlSeconds ?? 60 * 60 * 24) * 1000,
  );

  // Expired keys are not authoritative and must not permanently occupy the
  // unique principal/scope/key tuple.
  await opts.db
    .delete(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.principalKey, opts.principalKey),
        eq(idempotencyKeys.scope, opts.scope),
        eq(idempotencyKeys.key, opts.key),
        lte(idempotencyKeys.expiresAt, now),
      ),
    );

  const id = createId("idk");
  const [claimed] = await opts.db
    .insert(idempotencyKeys)
    .values({
      id,
      principalKey: opts.principalKey,
      scope: opts.scope,
      key: opts.key,
      requestHash: opts.requestHash,
      state: "processing",
      expiresAt,
    })
    .onConflictDoNothing({
      target: [
        idempotencyKeys.principalKey,
        idempotencyKeys.scope,
        idempotencyKeys.key,
      ],
    })
    .returning({ id: idempotencyKeys.id });

  if (claimed) return { kind: "started" as const, id: claimed.id };

  const existing = await opts.db.query.idempotencyKeys.findFirst({
    where: and(
      eq(idempotencyKeys.principalKey, opts.principalKey),
      eq(idempotencyKeys.scope, opts.scope),
      eq(idempotencyKeys.key, opts.key),
      gt(idempotencyKeys.expiresAt, now),
    ),
  });
  if (!existing) {
    // A concurrent expiry cleanup won. Let the caller safely retry the claim.
    return { kind: "in_flight" as const, id: null };
  }
  if (existing.requestHash !== opts.requestHash) {
    throw conflict(
      "IDEMPOTENCY_KEY_REUSED",
      "Idempotency-Key was reused with a different request payload",
    );
  }
  if (existing.state === "completed") {
    return {
      kind: "replay" as const,
      statusCode: existing.statusCode ?? 200,
      responseBody: existing.responseBody,
      resourceId: existing.resourceId,
    };
  }
  return { kind: "in_flight" as const, id: existing.id };
}

export async function completeIdempotency(opts: {
  db: IdempotencyTx;
  id: string;
  statusCode: number;
  responseBody: unknown;
  resourceId?: string;
}) {
  await opts.db
    .update(idempotencyKeys)
    .set({
      state: "completed",
      statusCode: opts.statusCode,
      responseBody: opts.responseBody,
      resourceId: opts.resourceId,
    })
    .where(eq(idempotencyKeys.id, opts.id));
}
