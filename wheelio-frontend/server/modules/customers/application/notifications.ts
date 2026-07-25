import { and, count, desc, eq, isNull, lt, or } from "drizzle-orm"
import { z } from "zod"
import { customerNotifications } from "@/db/schema"
import { decodeCursor, encodeCursor, localeSchema, paginationQuerySchema } from "@/server/contracts/pagination"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import { forbidden, notFound, validationError } from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository"
import { ensureProfile, findProfileByUserId } from "@/server/modules/customers/infrastructure/customer-repository"

const notificationCursorSchema = z.object({ at: z.string().datetime(), id: z.string().min(1) })
const readCommandSchema = z.object({ read: z.boolean() })

async function requireOwnedProfile(principal: EffectivePrincipal) {
  const db = getDb()
  let profile = await findProfileByUserId(db, principal.effectiveUserId)
  if (!profile) profile = await ensureProfile(db, { userId: principal.effectiveUserId, legalName: principal.name || principal.email })
  if (profile.userId !== principal.effectiveUserId) throw forbidden("TENANT_SCOPE_VIOLATION", "Notification inbox profile mismatch")
  return profile
}

export async function listCustomerNotifications(principal: EffectivePrincipal, url: URL, localeHint: string) {
  const profile = await requireOwnedProfile(principal)
  const query = paginationQuerySchema.safeParse(Object.fromEntries(url.searchParams))
  if (!query.success) throw validationError("Invalid pagination", { issues: query.error.issues })
  const locale = localeSchema.catch("en").parse(localeHint.split(",")[0]?.trim().split("-")[0])
  let cursor: z.infer<typeof notificationCursorSchema> | undefined
  if (query.data.after) {
    const decoded = decodeCursor(query.data.after)
    const parsed = notificationCursorSchema.safeParse(decoded)
    if (!parsed.success) throw validationError("Invalid notification cursor")
    cursor = parsed.data
  }
  const cursorWhere = cursor ? or(
    lt(customerNotifications.createdAt, new Date(cursor.at)),
    and(eq(customerNotifications.createdAt, new Date(cursor.at)), lt(customerNotifications.id, cursor.id)),
  ) : undefined
  const db = getDb()
  const [rows, unreadRows] = await Promise.all([
    db.select().from(customerNotifications).where(and(
      eq(customerNotifications.customerProfileId, profile.id),
      cursorWhere,
    )).orderBy(desc(customerNotifications.createdAt), desc(customerNotifications.id)).limit(query.data.limit + 1),
    db.select({ value: count() }).from(customerNotifications).where(and(
      eq(customerNotifications.customerProfileId, profile.id),
      isNull(customerNotifications.readAt),
    )),
  ])
  const hasMore = rows.length > query.data.limit
  const pageRows = rows.slice(0, query.data.limit)
  const last = pageRows.at(-1)
  return {
    data: pageRows.map((row) => ({
      id: row.id, type: row.type,
      title: locale === "fr" ? row.titleFr : row.titleEn,
      body: locale === "fr" ? row.bodyFr : row.bodyEn,
      href: row.href, metadata: row.metadata,
      readAt: row.readAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(),
    })),
    page: {
      hasMore, unreadCount: Number(unreadRows[0]?.value ?? 0),
      nextCursor: hasMore && last ? encodeCursor({ at: last.createdAt.toISOString(), id: last.id }) : null,
    },
  }
}

export async function setCustomerNotificationRead(principal: EffectivePrincipal, id: string, input: unknown, ctx: RequestContext) {
  if (principal.impersonating) throw forbidden("IMPERSONATION_READ_ONLY", "Impersonation sessions cannot change notifications")
  const parsed = readCommandSchema.safeParse(input)
  if (!parsed.success) throw validationError("Invalid notification command", { issues: parsed.error.issues })
  const profile = await requireOwnedProfile(principal)
  return withTransaction(getDb(), async (tx) => {
    const existing = await tx.query.customerNotifications.findFirst({ where: and(
      eq(customerNotifications.id, id), eq(customerNotifications.customerProfileId, profile.id),
    ) })
    if (!existing) throw notFound("Notification not found")
    const readAt = parsed.data.read ? (existing.readAt ?? new Date()) : null
    await tx.update(customerNotifications).set({ readAt }).where(and(
      eq(customerNotifications.id, id), eq(customerNotifications.customerProfileId, profile.id),
    ))
    const action = parsed.data.read ? "customer.notification.read" : "customer.notification.unread"
    await recordAudit(tx, { action, resourceType: "customer_notification", resourceId: id, tenantType: "customer", tenantId: profile.id, before: { readAt: existing.readAt }, after: { readAt } }, ctx, principal)
    await enqueueOutbox(tx, { aggregateType: "customer_notification", aggregateId: id, eventType: action, payload: { notificationId: id, customerProfileId: profile.id, read: parsed.data.read }, correlationId: ctx.correlationId })
    return { id, readAt: readAt?.toISOString() ?? null }
  })
}
