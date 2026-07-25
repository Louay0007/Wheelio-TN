import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    legalName: text("legal_name").notNull(),
    preferredName: text("preferred_name"),
    phone: text("phone"),
    phoneNormalized: text("phone_normalized"),
    dateOfBirth: text("date_of_birth"),
    nationality: text("nationality"),
    residenceCountry: text("residence_country"),
    addressLine: text("address_line"),
    city: text("city"),
    preferredLocale: text("preferred_locale").notNull().default("en"),
    theme: text("theme").notNull().default("system"),
    usualPickup: text("usual_pickup"),
    defaultAgeBand: text("default_age_band"),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    welcomeCompleted: boolean("welcome_completed").notNull().default(false),
    extrasInterests: jsonb("extras_interests")
      .$type<string[]>()
      .notNull()
      .default([]),
    riskStatus: text("risk_status").notNull().default("clear"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("customer_profiles_locale_idx").on(table.preferredLocale)],
);

export const customerDrivers = pgTable(
  "customer_drivers",
  {
    id: text("id").primaryKey(),
    customerProfileId: text("customer_profile_id")
      .notNull()
      .references(() => customerProfiles.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    ageBand: text("age_band").notNull(),
    dateOfBirth: text("date_of_birth"),
    licenseCountry: text("license_country").notNull(),
    licenseNumberEncrypted: text("license_number_encrypted"),
    licenseNumberHash: text("license_number_hash"),
    licenseExpiry: text("license_expiry").notNull(),
    licenseCategory: text("license_category").notNull().default("B"),
    isPrimary: boolean("is_primary").notNull().default(false),
    notes: text("notes"),
    version: integer("version").notNull().default(1),
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
    index("customer_drivers_profile_idx").on(table.customerProfileId),
    uniqueIndex("customer_drivers_one_primary_idx")
      .on(table.customerProfileId)
      .where(sql`${table.isPrimary} = true AND ${table.deletedAt} IS NULL`),
  ],
);

export const consentEvents = pgTable(
  "consent_events",
  {
    id: text("id").primaryKey(),
    subjectType: text("subject_type").notNull().default("customer"),
    subjectId: text("subject_id").notNull(),
    consentType: text("consent_type").notNull(),
    consentVersion: text("consent_version").notNull(),
    granted: boolean("granted").notNull(),
    source: text("source").notNull().default("account"),
    ipAddress: text("ip_address"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("consent_events_subject_idx").on(table.subjectType, table.subjectId),
    index("consent_events_type_idx").on(table.consentType, table.occurredAt),
  ],
);

export const customerNotifications = pgTable(
  "customer_notifications",
  {
    id: text("id").primaryKey(),
    customerProfileId: text("customer_profile_id")
      .notNull()
      .references(() => customerProfiles.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    titleEn: text("title_en").notNull(),
    titleFr: text("title_fr").notNull(),
    bodyEn: text("body_en").notNull().default(""),
    bodyFr: text("body_fr").notNull().default(""),
    href: text("href"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("customer_notifications_feed_idx").on(
      table.customerProfileId,
      table.createdAt,
      table.id,
    ),
    index("customer_notifications_unread_idx")
      .on(table.customerProfileId, table.createdAt)
      .where(sql`${table.readAt} IS NULL`),
  ],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: text("id").primaryKey(),
    principalType: text("principal_type").notNull(),
    principalId: text("principal_id").notNull(),
    eventKey: text("event_key").notNull(),
    channel: text("channel").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    locale: text("locale").notNull().default("en"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("notification_preferences_unique_idx").on(
      table.principalType,
      table.principalId,
      table.eventKey,
      table.channel,
    ),
  ],
);

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: text("id").primaryKey(),
    customerProfileId: text("customer_profile_id")
      .notNull()
      .references(() => customerProfiles.id, { onDelete: "cascade" }),
    label: text("label"),
    querySnapshot: jsonb("query_snapshot")
      .$type<Record<string, unknown>>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("saved_searches_customer_idx").on(table.customerProfileId)],
);

export const savedOffers = pgTable(
  "saved_offers",
  {
    id: text("id").primaryKey(),
    customerProfileId: text("customer_profile_id")
      .notNull()
      .references(() => customerProfiles.id, { onDelete: "cascade" }),
    offerId: text("offer_id").notNull(),
    offerSnapshot: jsonb("offer_snapshot")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("saved_offers_unique_idx").on(
      table.customerProfileId,
      table.offerId,
    ),
  ],
);

export const privacyRequests = pgTable(
  "privacy_requests",
  {
    id: text("id").primaryKey(),
    customerProfileId: text("customer_profile_id")
      .notNull()
      .references(() => customerProfiles.id, { onDelete: "cascade" }),
    requestType: text("request_type").notNull(),
    status: text("status").notNull().default("pending"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    legalHoldReason: text("legal_hold_reason"),
    artifactObjectId: text("artifact_object_id"),
    failureReason: text("failure_reason"),
    processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
    artifactExpiresAt: timestamp("artifact_expires_at", { withTimezone: true }),
    retentionUntil: timestamp("retention_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("privacy_requests_customer_idx").on(
      table.customerProfileId,
      table.status,
    ),
    uniqueIndex("privacy_requests_active_type_idx")
      .on(table.customerProfileId, table.requestType)
      .where(sql`${table.status} IN ('pending', 'queued', 'processing', 'awaiting_retention')`),
  ],
);
