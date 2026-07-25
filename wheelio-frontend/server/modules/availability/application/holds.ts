import { and, eq, gt, sql } from "drizzle-orm"
import { z } from "zod"
import { inventoryHolds, quotes, vehicles } from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import {
  conflict,
  forbidden,
  notFound,
  validationError,
} from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import {
  beginIdempotency,
  completeIdempotency,
  hashRequestPayload,
} from "@/server/core/idempotency/service"
import { assertPoolCapacity } from "@/server/modules/bookings/application/modifications"

const holdSchema = z.object({
  expectedQuoteVersion: z.number().int().positive().default(1),
  vehicleId: z.string().min(1).optional(),
  poolId: z.string().min(1).optional(),
})

function isExclusionViolation(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes("no_overlapping_vehicle") ||
    message.includes("exclusion") ||
    message.includes("23P01")
  )
}

export async function createInventoryHold(
  quoteId: string,
  rawInput: unknown,
  ctx: RequestContext,
  opts?: {
    principal?: EffectivePrincipal | null
    idempotencyKey?: string | null
  },
) {
  const parsed = holdSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid hold payload", { issues: parsed.error.issues })
  }
  const input = parsed.data
  const db = getDb()
  const principalKey = opts?.principal?.effectiveUserId ?? `anon:${ctx.ipAddress}`
  const requestHash = hashRequestPayload({ quoteId, ...input })

  return withTransaction(db, async (tx) => {
    let idempotencyId: string | null = null
    if (opts?.idempotencyKey) {
      const gate = await beginIdempotency({
        db: tx,
        principalKey,
        scope: `quote.hold:${quoteId}`,
        key: opts.idempotencyKey,
        requestHash,
      })
      if (gate.kind === "replay") {
        return gate.responseBody as {
          holdId: string
          expiresAt: string
          vehicleId: string | null
        }
      }
      if (gate.kind === "in_flight") {
        throw conflict(
          "IDEMPOTENCY_KEY_REUSED",
          "Hold request is already in progress",
        )
      }
      idempotencyId = gate.id
    }

    const quote = await tx.query.quotes.findFirst({
      where: eq(quotes.id, quoteId),
    })
    if (!quote) throw notFound("Quote not found")
    if (quote.expiresAt < new Date() || quote.status !== "open") {
      throw conflict("HOLD_EXPIRED", "Quote is not holdable")
    }
    if (quote.version !== input.expectedQuoteVersion) {
      throw conflict("VERSION_CONFLICT", "Quote version mismatch", {
        expected: input.expectedQuoteVersion,
        actual: quote.version,
      })
    }

    const poolCheck = await assertPoolCapacity(
      quote.agencyId,
      quote.categoryCode,
      quote.pickupAt,
      quote.returnAt,
      { poolId: input.poolId, tx },
    )

    let vehicleId = input.vehicleId ?? quote.vehicleId ?? null
    if (!vehicleId) {
      const candidate = await tx.query.vehicles.findFirst({
        where: and(
          eq(vehicles.agencyId, quote.agencyId),
          eq(vehicles.categoryCode, quote.categoryCode),
          eq(vehicles.status, "ready"),
          eq(vehicles.active, true),
        ),
      })
      vehicleId = candidate?.id ?? null
    } else {
      const vehicle = await tx.query.vehicles.findFirst({
        where: and(
          eq(vehicles.id, vehicleId),
          eq(vehicles.agencyId, quote.agencyId),
          eq(vehicles.categoryCode, quote.categoryCode),
          eq(vehicles.status, "ready"),
          eq(vehicles.active, true),
        ),
      })
      if (!vehicle) throw notFound("Vehicle not found for quote inventory")
    }

    if (!vehicleId) {
      throw conflict(
        "INVENTORY_CONFLICT",
        "No vehicle available for this quote category",
      )
    }

    // Soft check before insert; GiST EXCLUDE is the hard guarantee.
    const overlap = await tx.execute(sql`
      SELECT id FROM inventory_holds
      WHERE vehicle_id = ${vehicleId}
        AND status IN ('held')
        AND expires_at > now()
        AND tstzrange(reserved_start, reserved_end, '[)') &&
            tstzrange(${quote.pickupAt}, ${quote.returnAt}, '[)')
      LIMIT 1
    `)
    const overlapRows =
      (overlap as unknown as { rows?: unknown[] }).rows ??
      (Array.isArray(overlap) ? overlap : [])
    if (Array.isArray(overlapRows) && overlapRows.length > 0) {
      throw conflict(
        "INVENTORY_CONFLICT",
        "Vehicle is already reserved for overlapping dates",
      )
    }

    const holdId = createId("hold")
    const expiresAt = new Date(
      Math.min(quote.expiresAt.getTime(), Date.now() + 1000 * 60 * 15),
    )

    try {
      await tx.insert(inventoryHolds).values({
        id: holdId,
        quoteId: quote.id,
        agencyId: quote.agencyId,
        vehicleId,
        poolId: poolCheck.poolId,
        reservedStart: quote.pickupAt,
        reservedEnd: quote.returnAt,
        status: "held",
        expiresAt,
        idempotencyKey: opts?.idempotencyKey ?? null,
      })
    } catch (error) {
      if (isExclusionViolation(error)) {
        throw conflict(
          "INVENTORY_CONFLICT",
          "Vehicle is already reserved for overlapping dates",
        )
      }
      throw error
    }

    await recordAudit(
      tx,
      {
        action: "inventory.hold_created",
        resourceType: "inventory_hold",
        resourceId: holdId,
        tenantType: "agency",
        tenantId: quote.agencyId,
        after: { holdId, vehicleId, quoteId },
      },
      ctx,
      opts?.principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "inventory_hold",
      aggregateId: holdId,
      eventType: "inventory.hold_created",
      payload: { holdId, quoteId, vehicleId, agencyId: quote.agencyId },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    const body = {
      holdId,
      expiresAt: expiresAt.toISOString(),
      vehicleId,
    }
    if (idempotencyId) {
      await completeIdempotency({
        db: tx,
        id: idempotencyId,
        statusCode: 201,
        responseBody: body,
        resourceId: holdId,
      })
    }
    return body
  })
}

export async function releaseInventoryHold(
  quoteId: string,
  ctx: RequestContext,
  principal?: EffectivePrincipal | null,
) {
  if (principal?.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot release holds",
    )
  }
  const db = getDb()
  return withTransaction(db, async (tx) => {
    const active = await tx.query.inventoryHolds.findFirst({
      where: and(
        eq(inventoryHolds.quoteId, quoteId),
        eq(inventoryHolds.status, "held"),
        gt(inventoryHolds.expiresAt, new Date()),
      ),
    })
    if (!active) {
      return { released: true as const, alreadyReleased: true as const }
    }
    await tx
      .update(inventoryHolds)
      .set({ status: "released" })
      .where(eq(inventoryHolds.id, active.id))

    await recordAudit(
      tx,
      {
        action: "inventory.hold_released",
        resourceType: "inventory_hold",
        resourceId: active.id,
        tenantType: "agency",
        tenantId: active.agencyId,
      },
      ctx,
      principal,
    )
    await enqueueOutbox(tx, {
      aggregateType: "inventory_hold",
      aggregateId: active.id,
      eventType: "inventory.hold_released",
      payload: { holdId: active.id, quoteId },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    return { released: true as const, alreadyReleased: false as const }
  })
}

export async function getActiveHoldForQuote(quoteId: string) {
  const db = getDb()
  return db.query.inventoryHolds.findFirst({
    where: and(
      eq(inventoryHolds.quoteId, quoteId),
      eq(inventoryHolds.status, "held"),
      gt(inventoryHolds.expiresAt, new Date()),
    ),
  })
}

/** Marks stale holds explicitly so retries can safely reclaim inventory. */
export async function recoverExpiredInventoryHolds(now = new Date()) {
  const db = getDb()
  const rows = await db
    .update(inventoryHolds)
    .set({ status: "expired" })
    .where(
      and(
        eq(inventoryHolds.status, "held"),
        sql`${inventoryHolds.expiresAt} <= ${now}`,
      ),
    )
    .returning({ holdId: inventoryHolds.id })
  return { recovered: rows.length }
}
