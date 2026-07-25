import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { outboxEvents } from "@/db/schema";
import { createId } from "@/server/contracts/ids";
import type { Database } from "@/server/core/database/client";
import type { DbTransaction } from "@/server/core/database/transaction";

type OutboxTx = Database | DbTransaction;

export type OutboxEventInput = {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  eventVersion?: number;
  payload: Record<string, unknown>;
  correlationId?: string | null;
  causationId?: string | null;
};

export async function enqueueOutbox(
  db: OutboxTx,
  input: OutboxEventInput | OutboxEventInput[],
) {
  const events = Array.isArray(input) ? input : [input];
  const rows = events.map((event) => ({
    id: createId("obx"),
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    eventType: event.eventType,
    eventVersion: event.eventVersion ?? 1,
    payload: event.payload,
    correlationId: event.correlationId ?? null,
    causationId: event.causationId ?? null,
  }));
  if (rows.length === 0) return [];
  await db.insert(outboxEvents).values(rows);
  return rows.map((row) => row.id);
}

export async function claimUnpublishedOutbox(
  db: Database,
  limit = 50,
  workerId = `worker-${process.pid}`,
  leaseMinutes = 5,
) {
  const cutoff = new Date(Date.now() - leaseMinutes * 60_000);
  const safeLimit = Math.max(1, Math.min(limit, 100));
  return db.transaction(async (tx) => {
    const claimed = await tx.execute(sql`
      WITH candidates AS (
        SELECT id
        FROM outbox_events
        WHERE published_at IS NULL
          AND dead_lettered_at IS NULL
          AND (processing_at IS NULL OR processing_at < ${cutoff})
        ORDER BY occurred_at, id
        FOR UPDATE SKIP LOCKED
        LIMIT ${safeLimit}
      )
      UPDATE outbox_events AS event
      SET processing_at = NOW(), processing_by = ${workerId}
      FROM candidates
      WHERE event.id = candidates.id
      RETURNING event.*
    `);
    return Array.from(claimed) as Array<typeof outboxEvents.$inferSelect>;
  });
}

export async function markOutboxPublished(db: Database, id: string) {
  await db
    .update(outboxEvents)
    .set({
      publishedAt: new Date(),
      processingAt: null,
      processingBy: null,
      lastError: null,
      publishAttempts: sql`${outboxEvents.publishAttempts} + 1`,
    })
    .where(eq(outboxEvents.id, id));
}

export async function markOutboxFailed(
  db: Database,
  id: string,
  error: string,
  deadLetter = false,
) {
  await db
    .update(outboxEvents)
    .set({
      lastError: error.slice(0, 2000),
      processingAt: null,
      processingBy: null,
      publishAttempts: sql`${outboxEvents.publishAttempts} + 1`,
      deadLetteredAt: deadLetter ? new Date() : null,
    })
    .where(eq(outboxEvents.id, id));
}

export async function requeueStaleProcessing(
  db: Database,
  olderThanMinutes = 15,
) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  return db
    .update(outboxEvents)
    .set({ processingAt: null, processingBy: null })
    .where(
      and(
        isNull(outboxEvents.publishedAt),
        isNull(outboxEvents.deadLetteredAt),
        or(
          isNull(outboxEvents.processingAt),
          lt(outboxEvents.processingAt, cutoff),
        ),
      ),
    )
    .returning({ id: outboxEvents.id });
}
