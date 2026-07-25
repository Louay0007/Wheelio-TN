import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    actorUserId: text("actor_user_id"),
    effectiveUserId: text("effective_user_id"),
    actorClass: text("actor_class").notNull().default("system"),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    tenantType: text("tenant_type"),
    tenantId: text("tenant_id"),
    reason: text("reason"),
    ticket: text("ticket"),
    requestId: text("request_id"),
    correlationId: text("correlation_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    beforeDigest: text("before_digest"),
    afterDigest: text("after_digest"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  },
  (table) => [
    index("audit_events_occurred_at_idx").on(table.occurredAt),
    index("audit_events_actor_idx").on(table.actorUserId),
    index("audit_events_resource_idx").on(table.resourceType, table.resourceId),
    index("audit_events_request_idx").on(table.requestId),
  ],
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: text("id").primaryKey(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    eventType: text("event_type").notNull(),
    eventVersion: integer("event_version").notNull().default(1),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    correlationId: text("correlation_id"),
    causationId: text("causation_id"),
    publishAttempts: integer("publish_attempts").notNull().default(0),
    processingAt: timestamp("processing_at", { withTimezone: true }),
    processingBy: text("processing_by"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deadLetteredAt: timestamp("dead_lettered_at", { withTimezone: true }),
    lastError: text("last_error"),
  },
  (table) => [
    index("outbox_events_unpublished_idx").on(
      table.publishedAt,
      table.deadLetteredAt,
      table.occurredAt,
    ),
    index("outbox_events_aggregate_idx").on(
      table.aggregateType,
      table.aggregateId,
    ),
  ],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: text("id").primaryKey(),
    principalKey: text("principal_key").notNull(),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    requestHash: text("request_hash").notNull(),
    state: text("state").notNull().default("processing"),
    statusCode: integer("status_code"),
    responseBody: jsonb("response_body").$type<unknown>(),
    resourceId: text("resource_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("idempotency_keys_unique_idx").on(
      table.principalKey,
      table.scope,
      table.key,
    ),
    index("idempotency_keys_expires_idx").on(table.expiresAt),
  ],
);

export const storedObjects = pgTable(
  "stored_objects",
  {
    id: text("id").primaryKey(),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull(),
    ownerType: text("owner_type").notNull(),
    ownerId: text("owner_id").notNull(),
    purpose: text("purpose").notNull(),
    classification: text("classification").notNull().default("private"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksumSha256: text("checksum_sha256"),
    scanStatus: text("scan_status").notNull().default("pending"),
    legalHold: integer("legal_hold").notNull().default(0),
    retentionUntil: timestamp("retention_until", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("stored_objects_bucket_key_idx").on(
      table.bucket,
      table.objectKey,
    ),
    index("stored_objects_owner_idx").on(table.ownerType, table.ownerId),
    index("stored_objects_scan_idx").on(table.scanStatus),
  ],
);

export const agencyMemberships = pgTable(
  "agency_memberships",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    branchScopeId: text("branch_scope_id"),
    invitedByUserId: text("invited_by_user_id"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("agency_memberships_unique_idx").on(
      table.agencyId,
      table.userId,
    ),
    index("agency_memberships_user_idx").on(table.userId),
  ],
);

export const adminMemberships = pgTable(
  "admin_memberships",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    mfaRequired: integer("mfa_required").notNull().default(0),
    invitedByUserId: text("invited_by_user_id"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("admin_memberships_role_idx").on(table.role, table.status)],
);
