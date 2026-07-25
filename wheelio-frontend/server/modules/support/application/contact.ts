import { z } from "zod"
import { createId } from "@/server/contracts/ids"
import { localeSchema } from "@/server/contracts/pagination"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import { validationError } from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import {
  beginIdempotency,
  completeIdempotency,
  hashRequestPayload,
} from "@/server/core/idempotency/service"

const enquirySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  category: z.enum([
    "booking",
    "payment",
    "partner",
    "privacy",
    "other",
  ]),
  bookingReference: z.string().max(40).optional(),
  message: z.string().min(10).max(4000),
  locale: localeSchema.default("en"),
  consent: z.literal(true),
})

/**
 * Public contact enquiry — creates a support case stub via outbox.
 * Does not reveal whether a booking reference exists.
 */
export async function createContactEnquiry(
  rawInput: unknown,
  ctx: RequestContext,
  idempotencyKey?: string | null,
) {
  const parsed = enquirySchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid contact enquiry", {
      issues: parsed.error.issues,
    })
  }
  const input = parsed.data
  const db = getDb()
  const requestHash = hashRequestPayload(input)
  const principalKey = `ip:${ctx.ipAddress ?? "unknown"}:${input.email}`

  return withTransaction(db, async (tx) => {
    if (idempotencyKey) {
      const gate = await beginIdempotency({
        db: tx,
        principalKey,
        scope: "public.contact_enquiry",
        key: idempotencyKey,
        requestHash,
      })
      if (gate.kind === "replay") {
        return gate.responseBody as {
          enquiryId: string
          status: string
        }
      }
    }

    const enquiryId = createId("enq")
    await recordAudit(
      tx,
      {
        action: "support.enquiry.created",
        resourceType: "contact_enquiry",
        resourceId: enquiryId,
        tenantType: "platform",
        tenantId: "platform",
        metadata: {
          category: input.category,
          locale: input.locale,
          // Never echo booking existence.
          hasBookingReference: Boolean(input.bookingReference),
        },
      },
      ctx,
      null,
    )
    await enqueueOutbox(tx, {
      aggregateType: "support_case",
      aggregateId: enquiryId,
      eventType: "case.created",
      payload: {
        enquiryId,
        category: input.category,
        locale: input.locale,
        email: input.email,
        name: input.name,
      },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })
    await enqueueOutbox(tx, {
      aggregateType: "notification",
      aggregateId: enquiryId,
      eventType: "support_notification.requested",
      payload: { enquiryId },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    })

    const body = { enquiryId, status: "received" }
    if (idempotencyKey) {
      const existing = await tx.query.idempotencyKeys.findFirst({
        where: (table, { and: whereAnd, eq: whereEq }) =>
          whereAnd(
            whereEq(table.principalKey, principalKey),
            whereEq(table.scope, "public.contact_enquiry"),
            whereEq(table.key, idempotencyKey),
          ),
      })
      if (existing) {
        await completeIdempotency({
          db: tx,
          id: existing.id,
          statusCode: 201,
          responseBody: body,
          resourceId: enquiryId,
        })
      }
    }
    return body
  })
}

export function getPartnerContent(localeRaw: string) {
  const locale = localeSchema.safeParse(localeRaw)
  if (!locale.success) {
    throw validationError("Unsupported locale", { locale: localeRaw })
  }
  if (locale.data === "fr") {
    return {
      locale: "fr" as const,
      title: "Devenir partenaire Wheelio TN",
      commissionNote:
        "La commission s'applique au total commissionnable (location + frais obligatoires − remises). Le dépôt de garantie n'est jamais inclus.",
      tiers: [
        { name: "Standard", rateBps: 1200 },
        { name: "Preferentiel", rateBps: 1000 },
      ],
      eligibility: [
        "Agence établie en Tunisie",
        "Documents de conformité à jour",
        "Flotte active avec tarifs nets",
      ],
    }
  }
  return {
    locale: "en" as const,
    title: "Partner with Wheelio TN",
    commissionNote:
      "Commission applies to the commissionable total (rental + mandatory fees − discounts). Security deposits are never included.",
    tiers: [
      { name: "Standard", rateBps: 1200 },
      { name: "Preferred", rateBps: 1000 },
    ],
    eligibility: [
      "Tunisia-based rental agency",
      "Up-to-date compliance documents",
      "Active fleet with net daily rates",
    ],
  }
}
