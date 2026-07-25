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

export const agencies = pgTable(
  "agencies",
  {
    id: text().primaryKey().notNull(),
    slug: text().notNull(),
    tradeName: text("trade_name").notNull(),
    legalName: text("legal_name").notNull(),
    city: text().notNull(),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    verificationStatus: text("verification_status").default("draft").notNull(),
    commissionTierBps: integer("commission_tier_bps").default(1200).notNull(),
    bookingMode: text("booking_mode").default("request").notNull(),
    instantEnabled: boolean("instant_enabled").default(false).notNull(),
    publicVisibility: boolean("public_visibility").default(false).notNull(),
    logoUrl: text("logo_url"),
    ratingAverage: integer("rating_average_bps").default(0).notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    version: integer().default(1).notNull(),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agencies_city_idx").using("btree", table.city),
    index("agencies_public_idx").using(
      "btree",
      table.publicVisibility,
      table.verificationStatus,
    ),
    uniqueIndex("agencies_slug_idx").using("btree", table.slug),
  ],
);

export const agencyProfilesI18n = pgTable(
  "agency_profiles_i18n",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    locale: text().notNull(),
    publicName: text("public_name").notNull(),
    bio: text().default("").notNull(),
    pickupDescription: text("pickup_description").default("").notNull(),
  },
  (table) => [
    uniqueIndex("agency_profiles_i18n_unique_idx").using(
      "btree",
      table.agencyId,
      table.locale,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_profiles_i18n_agency_id_agencies_id_fk",
    }).onDelete("cascade"),
  ],
);

export const locations = pgTable(
  "locations",
  {
    id: text().primaryKey().notNull(),
    slug: text().notNull(),
    type: text().notNull(),
    region: text().notNull(),
    searchPickup: text("search_pickup").notNull(),
    startingFromMillimes: integer("starting_from_millimes"),
    status: text().default("published").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("locations_slug_idx").using("btree", table.slug),
    index("locations_status_idx").using("btree", table.status, table.sortOrder),
  ],
);

export const locationTranslations = pgTable(
  "location_translations",
  {
    id: text().primaryKey().notNull(),
    locationId: text("location_id").notNull(),
    locale: text().notNull(),
    name: text().notNull(),
    shortName: text("short_name").notNull(),
    blurb: text().notNull(),
    intro: text().notNull(),
    pickupTipsJson: jsonb("pickup_tips_json").default([]).notNull(),
    faqsJson: jsonb("faqs_json").default([]).notNull(),
  },
  (table) => [
    uniqueIndex("location_translations_unique_idx").using(
      "btree",
      table.locationId,
      table.locale,
    ),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [locations.id],
      name: "location_translations_location_id_locations_id_fk",
    }).onDelete("cascade"),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id"),
    customerUserId: text("customer_user_id"),
    agencyId: text("agency_id").notNull(),
    locationId: text("location_id"),
    rating: integer().notNull(),
    body: text().notNull(),
    authorDisplayName: text("author_display_name").notNull(),
    status: text().default("pending").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("reviews_agency_status_idx").using(
      "btree",
      table.agencyId,
      table.status,
    ),
    uniqueIndex("reviews_booking_unique_idx").using("btree", table.bookingId),
    index("reviews_location_status_idx").using(
      "btree",
      table.locationId,
      table.status,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "reviews_agency_id_agencies_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [locations.id],
      name: "reviews_location_id_locations_id_fk",
    }),
  ],
);

export const vehicleCategories = pgTable(
  "vehicle_categories",
  {
    id: text().primaryKey().notNull(),
    code: text().notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    active: boolean().default(true).notNull(),
    attributesJson: jsonb("attributes_json").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vehicle_categories_active_idx").using(
      "btree",
      table.active,
      table.sortOrder,
    ),
    uniqueIndex("vehicle_categories_code_idx").using("btree", table.code),
  ],
);

export const vehicleCategoryTranslations = pgTable(
  "vehicle_category_translations",
  {
    id: text().primaryKey().notNull(),
    categoryId: text("category_id").notNull(),
    locale: text().notNull(),
    label: text().notNull(),
    blurb: text().default("").notNull(),
    whoFor: text("who_for").default("").notNull(),
  },
  (table) => [
    uniqueIndex("vehicle_category_translations_unique_idx").using(
      "btree",
      table.categoryId,
      table.locale,
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [vehicleCategories.id],
      name: "vehicle_category_translations_category_id_vehicle_categories_id",
    }).onDelete("cascade"),
  ],
);
