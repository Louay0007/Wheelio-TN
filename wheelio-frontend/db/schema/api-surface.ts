import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { storedObjects } from "./platform";
import { branches } from "./operations";
import { agencies } from "./catalog";
import { bookings } from "./bookings";

export const refundRequests = pgTable(
  "refund_requests",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    status: text().default("pending").notNull(),
    reason: text().notNull(),
    customerAmountMillimes: bigint("customer_amount_millimes", {
      mode: "bigint",
    }).notNull(),
    agencyClawbackMillimes: bigint("agency_clawback_millimes", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    wheelioAbsorbsMillimes: bigint("wheelio_absorbs_millimes", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    includesDeposit: boolean("includes_deposit").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("refund_requests_booking_idx").using(
      "btree",
      table.bookingId,
      table.status,
    ),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "refund_requests_booking_id_bookings_id_fk",
    }),
  ],
);

export const supportCases = pgTable(
  "support_cases",
  {
    id: text().primaryKey().notNull(),
    subject: text().notNull(),
    status: text().default("open").notNull(),
    priority: text().default("normal").notNull(),
    bookingId: text("booking_id"),
    agencyId: text("agency_id"),
    customerProfileId: text("customer_profile_id"),
    channel: text().default("in_app").notNull(),
    tagsJson: jsonb("tags_json").$type<string[]>().default([]).notNull(),
    ownerUserId: text("owner_user_id"),
    body: text(),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("support_cases_booking_idx").using("btree", table.bookingId),
    index("support_cases_status_idx").using(
      "btree",
      table.status,
      table.updatedAt,
    ),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "support_cases_booking_id_bookings_id_fk",
    }),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "support_cases_agency_id_agencies_id_fk",
    }),
  ],
);

export const supportCaseNotes = pgTable(
  "support_case_notes",
  {
    id: text().primaryKey().notNull(),
    caseId: text("case_id").notNull(),
    authorUserId: text("author_user_id").notNull(),
    body: text().notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("support_case_notes_case_idx").using(
      "btree",
      table.caseId,
      table.createdAt,
    ),
    foreignKey({
      columns: [table.caseId],
      foreignColumns: [supportCases.id],
      name: "support_case_notes_case_id_support_cases_id_fk",
    }).onDelete("cascade"),
  ],
);

export const adminNotifications = pgTable(
  "admin_notifications",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id"),
    title: text().notNull(),
    body: text().notNull(),
    kind: text().default("info").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_notifications_user_idx").using(
      "btree",
      table.userId,
      table.readAt,
    ),
  ],
);

export const feesCatalog = pgTable(
  "fees_catalog",
  {
    id: text().primaryKey().notNull(),
    code: text().notNull(),
    nameEn: text("name_en").notNull(),
    nameFr: text("name_fr").notNull(),
    defaultMillimes: integer("default_millimes").default(0).notNull(),
    active: boolean().default(true).notNull(),
    isDeposit: boolean("is_deposit").default(false).notNull(),
    version: integer().default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("fees_catalog_code_unique").on(table.code)],
);

export const platformSettings = pgTable(
  "platform_settings",
  {
    id: text().primaryKey().notNull(),
    key: text().notNull(),
    valueJson: jsonb("value_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    version: integer().default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("platform_settings_key_unique").on(table.key)],
);

export const slaPolicies = pgTable(
  "sla_policies",
  {
    id: text().primaryKey().notNull(),
    key: text().notNull(),
    name: text().notNull(),
    targetMinutes: integer("target_minutes").notNull(),
    appliesTo: text("applies_to").default("booking_acceptance").notNull(),
    active: boolean().default(true).notNull(),
    version: integer().default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("sla_policies_key_unique").on(table.key)],
);

export const agencyDocuments = pgTable(
  "agency_documents",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    kind: text().notNull(),
    title: text().notNull(),
    storedObjectId: text("stored_object_id"),
    status: text().default("pending").notNull(),
    notes: text(),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agency_documents_agency_idx").using(
      "btree",
      table.agencyId,
      table.kind,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_documents_agency_id_agencies_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.storedObjectId],
      foreignColumns: [storedObjects.id],
      name: "agency_documents_stored_object_id_stored_objects_id_fk",
    }),
  ],
);

export const branchDeliveryZones = pgTable(
  "branch_delivery_zones",
  {
    id: text().primaryKey().notNull(),
    branchId: text("branch_id").notNull(),
    agencyId: text("agency_id").notNull(),
    name: text().notNull(),
    feeMillimes: integer("fee_millimes").default(0).notNull(),
    radiusKm: integer("radius_km").default(10).notNull(),
    active: boolean().default(true).notNull(),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("branch_delivery_branch_idx").using("btree", table.branchId),
    foreignKey({
      columns: [table.branchId],
      foreignColumns: [branches.id],
      name: "branch_delivery_zones_branch_id_branches_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "branch_delivery_zones_agency_id_agencies_id_fk",
    }),
  ],
);

export const branchHours = pgTable(
  "branch_hours",
  {
    id: text().primaryKey().notNull(),
    branchId: text("branch_id").notNull(),
    agencyId: text("agency_id").notNull(),
    weekday: integer().notNull(),
    openTime: text("open_time").default("08:00").notNull(),
    closeTime: text("close_time").default("18:00").notNull(),
    closed: boolean().default(false).notNull(),
    version: integer().default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("branch_hours_agency_idx").using("btree", table.agencyId),
    uniqueIndex("branch_hours_unique_idx").using(
      "btree",
      table.branchId,
      table.weekday,
    ),
    foreignKey({
      columns: [table.branchId],
      foreignColumns: [branches.id],
      name: "branch_hours_branch_id_branches_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "branch_hours_agency_id_agencies_id_fk",
    }),
  ],
);
