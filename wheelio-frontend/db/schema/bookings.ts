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
import { customerProfiles } from "./customers";
import { agencies } from "./catalog";

export const inventoryHolds = pgTable(
  "inventory_holds",
  {
    id: text().primaryKey().notNull(),
    quoteId: text("quote_id").notNull(),
    agencyId: text("agency_id").notNull(),
    vehicleId: text("vehicle_id"),
    poolId: text("pool_id"),
    reservedStart: timestamp("reserved_start", {
      withTimezone: true,
    }).notNull(),
    reservedEnd: timestamp("reserved_end", { withTimezone: true }).notNull(),
    status: text().default("held").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("inventory_holds_idempotency_idx").using(
      "btree",
      table.idempotencyKey,
    ),
    index("inventory_holds_vehicle_idx").using(
      "btree",
      table.vehicleId,
      table.status,
      table.reservedStart,
      table.reservedEnd,
    ),
    foreignKey({
      columns: [table.quoteId],
      foreignColumns: [quotes.id],
      name: "inventory_holds_quote_id_quotes_id_fk",
    }),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "inventory_holds_agency_id_agencies_id_fk",
    }),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: text().primaryKey().notNull(),
    reference: text().notNull(),
    customerProfileId: text("customer_profile_id"),
    guestEmail: text("guest_email"),
    agencyId: text("agency_id").notNull(),
    branchId: text("branch_id"),
    quoteId: text("quote_id"),
    status: text().default("requested").notNull(),
    confirmationMode: text("confirmation_mode").default("request").notNull(),
    paymentMode: text("payment_mode").default("pay_at_agency").notNull(),
    pickupAt: timestamp("pickup_at", { withTimezone: true }).notNull(),
    returnAt: timestamp("return_at", { withTimezone: true }).notNull(),
    slaExpiresAt: timestamp("sla_expires_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("bookings_agency_idx").using("btree", table.agencyId, table.status),
    index("bookings_customer_idx").using(
      "btree",
      table.customerProfileId,
      table.status,
    ),
    uniqueIndex("bookings_reference_idx").using("btree", table.reference),
    foreignKey({
      columns: [table.customerProfileId],
      foreignColumns: [customerProfiles.id],
      name: "bookings_customer_profile_id_customer_profiles_id_fk",
    }),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "bookings_agency_id_agencies_id_fk",
    }),
    foreignKey({
      columns: [table.quoteId],
      foreignColumns: [quotes.id],
      name: "bookings_quote_id_quotes_id_fk",
    }),
  ],
);

export const bookingClaimTokens = pgTable(
  "booking_claim_tokens",
  {
    id: text().primaryKey().notNull(),
    tokenHash: text("token_hash").notNull(),
    bookingId: text("booking_id").notNull(),
    email: text().notNull(),
    requestedAccountUserId: text("requested_account_user_id"),
    claimedByUserId: text("claimed_by_user_id"),
    bookingVersion: integer("booking_version").notNull(),
    attempts: integer().default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("booking_claim_tokens_hash_idx").on(table.tokenHash),
    index("booking_claim_tokens_booking_idx").on(table.bookingId, table.createdAt),
    index("booking_claim_tokens_expiry_idx").on(table.expiresAt),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "booking_claim_tokens_booking_id_bookings_id_fk",
    }).onDelete("cascade"),
  ],
);

export const bookingAccessGrants = pgTable(
  "booking_access_grants",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    scopesJson: jsonb("scopes_json").$type<string[]>().default([]).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("booking_access_grants_token_hash_idx").on(table.tokenHash),
    index("booking_access_grants_booking_idx").on(
      table.bookingId,
      table.expiresAt,
    ),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "booking_access_grants_booking_id_bookings_id_fk",
    }).onDelete("cascade"),
  ],
);

export const bookingSnapshots = pgTable(
  "booking_snapshots",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    payloadJson: jsonb("payload_json")
      .$type<Record<string, unknown>>()
      .notNull(),
    payloadHash: text("payload_hash").notNull(),
    locale: text().default("en").notNull(),
    commissionableMillimes: bigint("commissionable_millimes", {
      mode: "bigint",
    }).notNull(),
    commissionMillimes: bigint("commission_millimes", {
      mode: "bigint",
    }).notNull(),
    agencyNetMillimes: bigint("agency_net_millimes", {
      mode: "bigint",
    }).notNull(),
    depositMillimes: bigint("deposit_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    currency: text().default("TND").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "booking_snapshots_booking_id_bookings_id_fk",
    }).onDelete("cascade"),
    unique("booking_snapshots_booking_id_unique").on(table.bookingId),
  ],
);

export const bookingStatusHistory = pgTable(
  "booking_status_history",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    actorUserId: text("actor_user_id"),
    effectiveUserId: text("effective_user_id"),
    reasonCode: text("reason_code"),
    reason: text(),
    source: text().default("api").notNull(),
    requestId: text("request_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("booking_status_history_booking_idx").using(
      "btree",
      table.bookingId,
      table.occurredAt,
    ),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "booking_status_history_booking_id_bookings_id_fk",
    }).onDelete("cascade"),
  ],
);

export const quotes = pgTable(
  "quotes",
  {
    id: text().primaryKey().notNull(),
    searchSessionId: text("search_session_id"),
    agencyId: text("agency_id").notNull(),
    branchId: text("branch_id"),
    categoryCode: text("category_code").notNull(),
    vehicleId: text("vehicle_id"),
    pickupAt: timestamp("pickup_at", { withTimezone: true }).notNull(),
    returnAt: timestamp("return_at", { withTimezone: true }).notNull(),
    confirmationMode: text("confirmation_mode").default("request").notNull(),
    paymentMode: text("payment_mode").default("pay_at_agency").notNull(),
    status: text().default("open").notNull(),
    currency: text().default("TND").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("quotes_agency_idx").using("btree", table.agencyId, table.status),
    index("quotes_expires_idx").using("btree", table.expiresAt),
    foreignKey({
      columns: [table.searchSessionId],
      foreignColumns: [searchSessions.id],
      name: "quotes_search_session_id_search_sessions_id_fk",
    }),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "quotes_agency_id_agencies_id_fk",
    }),
  ],
);

export const depositMemos = pgTable(
  "deposit_memos",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    holder: text().default("agency").notNull(),
    amountMillimes: bigint("amount_millimes", { mode: "bigint" }).notNull(),
    currency: text().default("TND").notNull(),
    method: text(),
    status: text().default("expected").notNull(),
    externalReference: text("external_reference"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("deposit_memos_booking_idx").using("btree", table.bookingId),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "deposit_memos_booking_id_bookings_id_fk",
    }),
  ],
);

export const quoteSnapshots = pgTable(
  "quote_snapshots",
  {
    id: text().primaryKey().notNull(),
    quoteId: text("quote_id").notNull(),
    payloadJson: jsonb("payload_json")
      .$type<Record<string, unknown>>()
      .notNull(),
    rentalMillimes: bigint("rental_millimes", { mode: "bigint" }).notNull(),
    mandatoryFeesMillimes: bigint("mandatory_fees_millimes", {
      mode: "bigint",
    }).notNull(),
    extrasMillimes: bigint("extras_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    discountMillimes: bigint("discount_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    commissionableMillimes: bigint("commissionable_millimes", {
      mode: "bigint",
    }).notNull(),
    agencyNetMillimes: bigint("agency_net_millimes", {
      mode: "bigint",
    }).notNull(),
    commissionMillimes: bigint("commission_millimes", {
      mode: "bigint",
    }).notNull(),
    onlineDueMillimes: bigint("online_due_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    deskDueMillimes: bigint("desk_due_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    depositMillimes: bigint("deposit_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    currency: text().default("TND").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("quote_snapshots_quote_idx").using("btree", table.quoteId),
    foreignKey({
      columns: [table.quoteId],
      foreignColumns: [quotes.id],
      name: "quote_snapshots_quote_id_quotes_id_fk",
    }).onDelete("cascade"),
    unique("quote_snapshots_quote_id_unique").on(table.quoteId),
  ],
);

export const searchSessions = pgTable(
  "search_sessions",
  {
    id: text().primaryKey().notNull(),
    customerProfileId: text("customer_profile_id"),
    anonymousKey: text("anonymous_key"),
    querySnapshot: jsonb("query_snapshot")
      .$type<Record<string, unknown>>()
      .notNull(),
    locale: text().default("en").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("search_sessions_customer_idx").using(
      "btree",
      table.customerProfileId,
    ),
    index("search_sessions_expires_idx").using("btree", table.expiresAt),
    foreignKey({
      columns: [table.customerProfileId],
      foreignColumns: [customerProfiles.id],
      name: "search_sessions_customer_profile_id_customer_profiles_id_fk",
    }),
  ],
);

export const ratePlans = pgTable(
  "rate_plans",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    branchId: text("branch_id"),
    categoryCode: text("category_code").notNull(),
    name: text().notNull(),
    netDailyMillimes: bigint("net_daily_millimes", {
      mode: "bigint",
    }).notNull(),
    minimumDays: integer("minimum_days").default(1).notNull(),
    maximumDays: integer("maximum_days"),
    active: boolean().default(true).notNull(),
    effectiveFrom: timestamp("effective_from", {
      withTimezone: true,
    }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("rate_plans_agency_category_idx").using(
      "btree",
      table.agencyId,
      table.categoryCode,
      table.active,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "rate_plans_agency_id_agencies_id_fk",
    }),
  ],
);

export const inventoryAllocations = pgTable(
  "inventory_allocations",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    agencyId: text("agency_id").notNull(),
    vehicleId: text("vehicle_id"),
    poolId: text("pool_id"),
    categoryCode: text("category_code"),
    reservedStart: timestamp("reserved_start", {
      withTimezone: true,
    }).notNull(),
    reservedEnd: timestamp("reserved_end", { withTimezone: true }).notNull(),
    status: text().default("held").notNull(),
    allocatedByUserId: text("allocated_by_user_id"),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("inventory_allocations_booking_idx").using("btree", table.bookingId),
    index("inventory_allocations_vehicle_idx").using(
      "btree",
      table.vehicleId,
      table.status,
      table.reservedStart,
      table.reservedEnd,
    ),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "inventory_allocations_booking_id_bookings_id_fk",
    }),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "inventory_allocations_agency_id_agencies_id_fk",
    }),
  ],
);
