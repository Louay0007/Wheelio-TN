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
import { vehicles } from "./vehicles";
import { storedObjects } from "./platform";
import { agencies } from "./catalog";
import { bookings } from "./bookings";

export const agencyFees = pgTable(
  "agency_fees",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    code: text().notNull(),
    nameEn: text("name_en").notNull(),
    nameFr: text("name_fr").notNull(),
    amountMillimes: bigint("amount_millimes", { mode: "bigint" }).notNull(),
    mandatory: boolean().default(false).notNull(),
    active: boolean().default(true).notNull(),
    includesDeposit: boolean("includes_deposit").default(false).notNull(),
    version: integer().default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agency_fees_agency_idx").using(
      "btree",
      table.agencyId,
      table.active,
    ),
    uniqueIndex("agency_fees_code_idx").using(
      "btree",
      table.agencyId,
      table.code,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_fees_agency_id_agencies_id_fk",
    }),
  ],
);

export const agencyNotificationPreferences = pgTable(
  "agency_notification_preferences",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    userId: text("user_id").notNull(),
    eventKey: text("event_key").notNull(),
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    smsEnabled: boolean("sms_enabled").default(false).notNull(),
    inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("agency_notif_prefs_unique_idx").using(
      "btree",
      table.agencyId,
      table.userId,
      table.eventKey,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_notification_preferences_agency_id_agencies_id_fk",
    }),
  ],
);

export const agencyNotifications = pgTable(
  "agency_notifications",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    userId: text("user_id"),
    type: text().notNull(),
    title: text().notNull(),
    body: text().default("").notNull(),
    href: text(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agency_notifications_agency_idx").using(
      "btree",
      table.agencyId,
      table.createdAt,
    ),
    index("agency_notifications_user_idx").using(
      "btree",
      table.userId,
      table.readAt,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_notifications_agency_id_agencies_id_fk",
    }),
  ],
);

export const agencyPolicies = pgTable(
  "agency_policies",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    kind: text().notNull(),
    locale: text().notNull(),
    summary: text().notNull(),
    bodyMarkdown: text("body_markdown").default("").notNull(),
    rulesJson: jsonb("rules_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true })
      .defaultNow()
      .notNull(),
    version: integer().default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("agency_policies_unique_idx").using(
      "btree",
      table.agencyId,
      table.kind,
      table.locale,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_policies_agency_id_agencies_id_fk",
    }),
  ],
);

export const availabilityBlocks = pgTable(
  "availability_blocks",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    vehicleId: text("vehicle_id"),
    branchId: text("branch_id"),
    kind: text().default("maintenance").notNull(),
    label: text().notNull(),
    reason: text(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: text().default("active").notNull(),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("availability_blocks_agency_idx").using(
      "btree",
      table.agencyId,
      table.startsAt,
      table.endsAt,
    ),
    index("availability_blocks_vehicle_idx").using(
      "btree",
      table.vehicleId,
      table.startsAt,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "availability_blocks_agency_id_agencies_id_fk",
    }),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [vehicles.id],
      name: "availability_blocks_vehicle_id_vehicles_id_fk",
    }).onDelete("cascade"),
  ],
);

export const bookingMessages = pgTable(
  "booking_messages",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    authorUserId: text("author_user_id").notNull(),
    authorClass: text("author_class").notNull(),
    visibility: text().default("both").notNull(),
    body: text().notNull(),
    staffMarked: boolean("staff_marked").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("booking_messages_booking_idx").using(
      "btree",
      table.bookingId,
      table.createdAt,
    ),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "booking_messages_booking_id_bookings_id_fk",
    }).onDelete("cascade"),
  ],
);

export const vehicleMedia = pgTable(
  "vehicle_media",
  {
    id: text().primaryKey().notNull(),
    vehicleId: text("vehicle_id").notNull(),
    agencyId: text("agency_id").notNull(),
    storedObjectId: text("stored_object_id").notNull(),
    kind: text().default("photo").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    caption: text(),
    moderationState: text("moderation_state").default("pending").notNull(),
    publicAt: timestamp("public_at", { withTimezone: true }),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vehicle_media_agency_idx").using("btree", table.agencyId),
    index("vehicle_media_vehicle_idx").using(
      "btree",
      table.vehicleId,
      table.sortOrder,
    ),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [vehicles.id],
      name: "vehicle_media_vehicle_id_vehicles_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "vehicle_media_agency_id_agencies_id_fk",
    }),
    foreignKey({
      columns: [table.storedObjectId],
      foreignColumns: [storedObjects.id],
      name: "vehicle_media_stored_object_id_stored_objects_id_fk",
    }),
  ],
);
