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
import { agencies } from "./catalog";
import { bookings } from "./bookings";
import { user } from "./auth";

export const analyticsRollups = pgTable(
  "analytics_rollups",
  {
    id: text().primaryKey().notNull(),
    metricKey: text("metric_key").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    dimensionsJson: jsonb("dimensions_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    valueMillimes: bigint("value_millimes", { mode: "bigint" }),
    valueCount: integer("value_count"),
    includesDeposit: boolean("includes_deposit").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("analytics_rollups_metric_idx").using(
      "btree",
      table.metricKey,
      table.periodStart,
      table.periodEnd,
    ),
  ],
);

export const agencyOnboardingSteps = pgTable(
  "agency_onboarding_steps",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    step: text().notNull(),
    payloadJson: jsonb("payload_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    version: integer().default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("agency_onboarding_steps_unique_idx").using(
      "btree",
      table.agencyId,
      table.step,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_onboarding_steps_agency_id_agencies_id_fk",
    }),
  ],
);

export const bookingModificationRequests = pgTable(
  "booking_modification_requests",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    proposedSnapshot: jsonb("proposed_snapshot")
      .$type<Record<string, unknown>>()
      .notNull(),
    priceDifferenceMillimes: bigint("price_difference_millimes", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    depositDifferenceMillimes: bigint("deposit_difference_millimes", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    status: text().default("open").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    actorUserId: text("actor_user_id"),
    decision: text(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("booking_modification_requests_booking_idx").using(
      "btree",
      table.bookingId,
      table.status,
    ),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "booking_modification_requests_booking_id_bookings_id_fk",
    }),
  ],
);

export const branches = pgTable(
  "branches",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    locationId: text("location_id"),
    name: text().notNull(),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    addressLine: text("address_line"),
    city: text().notNull(),
    lat: text(),
    lng: text(),
    timezone: text().default("Africa/Tunis").notNull(),
    active: boolean().default(true).notNull(),
    publicVisible: boolean("public_visible").default(true).notNull(),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("branches_agency_idx").using("btree", table.agencyId, table.active),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "branches_agency_id_agencies_id_fk",
    }),
  ],
);

export const handoverRecords = pgTable(
  "handover_records",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    odometer: integer(),
    fuelLevel: text("fuel_level"),
    conditionNotes: text("condition_notes"),
    deskCollectedMillimes: bigint("desk_collected_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    depositMemoMillimes: bigint("deposit_memo_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    actorUserId: text("actor_user_id"),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "handover_records_booking_id_bookings_id_fk",
    }),
    unique("handover_records_booking_id_unique").on(table.bookingId),
  ],
);

export const impersonationGrants = pgTable(
  "impersonation_grants",
  {
    id: text().primaryKey().notNull(),
    adminUserId: text("admin_user_id").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text().notNull(),
    ticket: text(),
    allowedScopesJson: jsonb("allowed_scopes_json")
      .$type<string[]>()
      .default([])
      .notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    stoppedAt: timestamp("stopped_at", { withTimezone: true }),
  },
  (table) => [
    index("impersonation_grants_admin_idx").using(
      "btree",
      table.adminUserId,
      table.expiresAt,
    ),
    foreignKey({
      columns: [table.adminUserId],
      foreignColumns: [user.id],
      name: "impersonation_grants_admin_user_id_user_id_fk",
    }),
  ],
);

export const paymentIntents = pgTable(
  "payment_intents",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    provider: text().default("stub").notNull(),
    providerReference: text("provider_reference"),
    purpose: text().default("rental").notNull(),
    amountMillimes: bigint("amount_millimes", { mode: "bigint" }).notNull(),
    currency: text().default("TND").notNull(),
    status: text().default("created").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payment_intents_booking_idx").using(
      "btree",
      table.bookingId,
      table.status,
    ),
    uniqueIndex("payment_intents_idempotency_idx").using(
      "btree",
      table.idempotencyKey,
    ),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "payment_intents_booking_id_bookings_id_fk",
    }),
  ],
);

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: text().primaryKey().notNull(),
    intentId: text("intent_id").notNull(),
    providerTransactionId: text("provider_transaction_id"),
    type: text().notNull(),
    amountMillimes: bigint("amount_millimes", { mode: "bigint" }).notNull(),
    status: text().notNull(),
    rawReceiptRef: text("raw_receipt_ref"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("payment_transactions_provider_idx").using(
      "btree",
      table.providerTransactionId,
    ),
    foreignKey({
      columns: [table.intentId],
      foreignColumns: [paymentIntents.id],
      name: "payment_transactions_intent_id_payment_intents_id_fk",
    }),
  ],
);

export const payoutBatches = pgTable(
  "payout_batches",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    status: text().default("draft").notNull(),
    totalMillimes: bigint("total_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    holdReason: text("hold_reason"),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payout_batches_agency_idx").using(
      "btree",
      table.agencyId,
      table.status,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "payout_batches_agency_id_agencies_id_fk",
    }),
  ],
);

export const payoutItems = pgTable(
  "payout_items",
  {
    id: text().primaryKey().notNull(),
    payoutId: text("payout_id").notNull(),
    bookingId: text("booking_id"),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    amountMillimes: bigint("amount_millimes", { mode: "bigint" }).notNull(),
    includesDeposit: boolean("includes_deposit").default(false).notNull(),
  },
  (table) => [
    index("payout_items_payout_idx").using("btree", table.payoutId),
    uniqueIndex("payout_items_source_unique_idx").using(
      "btree",
      table.sourceType,
      table.sourceId,
    ),
    foreignKey({
      columns: [table.payoutId],
      foreignColumns: [payoutBatches.id],
      name: "payout_items_payout_id_payout_batches_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "payout_items_booking_id_bookings_id_fk",
    }),
  ],
);

export const returnRecords = pgTable(
  "return_records",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    odometer: integer(),
    fuelLevel: text("fuel_level"),
    conditionNotes: text("condition_notes"),
    proposedChargesMillimes: bigint("proposed_charges_millimes", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    depositReleaseMillimes: bigint("deposit_release_millimes", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    actorUserId: text("actor_user_id"),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "return_records_booking_id_bookings_id_fk",
    }),
    unique("return_records_booking_id_unique").on(table.bookingId),
  ],
);

export const vehiclePools = pgTable(
  "vehicle_pools",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    branchId: text("branch_id"),
    categoryCode: text("category_code").notNull(),
    name: text().notNull(),
    capacity: integer().default(1).notNull(),
    allocationMode: text("allocation_mode").default("pool").notNull(),
    active: boolean().default(true).notNull(),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vehicle_pools_agency_category_idx").using(
      "btree",
      table.agencyId,
      table.categoryCode,
      table.active,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "vehicle_pools_agency_id_agencies_id_fk",
    }),
  ],
);
