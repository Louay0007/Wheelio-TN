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

export const adminStaffInvitations = pgTable(
  "admin_staff_invitations",
  {
    id: text().primaryKey().notNull(),
    email: text().notNull(),
    role: text().notNull(),
    tokenHash: text("token_hash").notNull(),
    status: text().default("pending").notNull(),
    invitedByUserId: text("invited_by_user_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_staff_invitations_email_idx").using(
      "btree",
      table.email,
      table.status,
    ),
    uniqueIndex("admin_staff_invitations_token_idx").using(
      "btree",
      table.tokenHash,
    ),
  ],
);

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: text().primaryKey().notNull(),
    key: text().notNull(),
    description: text(),
    enabled: boolean().default(false).notNull(),
    audience: text().default("all").notNull(),
    metadataJson: jsonb("metadata_json")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    version: integer().default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("feature_flags_enabled_idx").using("btree", table.enabled),
    unique("feature_flags_key_unique").on(table.key),
  ],
);

export const promotions = pgTable(
  "promotions",
  {
    id: text().primaryKey().notNull(),
    code: text().notNull(),
    nameEn: text("name_en").notNull(),
    nameFr: text("name_fr").notNull(),
    discountBps: integer("discount_bps").default(0).notNull(),
    status: text().default("draft").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    maxRedemptions: integer("max_redemptions"),
    redemptionCount: integer("redemption_count").default(0).notNull(),
    appliesToDeposit: boolean("applies_to_deposit").default(false).notNull(),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("promotions_status_idx").using("btree", table.status),
    unique("promotions_code_unique").on(table.code),
  ],
);

export const reconciliationRuns = pgTable(
  "reconciliation_runs",
  {
    id: text().primaryKey().notNull(),
    provider: text().default("stub").notNull(),
    status: text().default("open").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    matchedCount: integer("matched_count").default(0).notNull(),
    unmatchedCount: integer("unmatched_count").default(0).notNull(),
    notes: text(),
    createdByUserId: text("created_by_user_id"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("reconciliation_runs_status_idx").using("btree", table.status),
  ],
);

export const adminAgencyNotes = pgTable(
  "admin_agency_notes",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    authorUserId: text("author_user_id").notNull(),
    body: text().notNull(),
    visibility: text().default("internal").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_agency_notes_agency_idx").using(
      "btree",
      table.agencyId,
      table.createdAt,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "admin_agency_notes_agency_id_agencies_id_fk",
    }).onDelete("cascade"),
  ],
);

export const agencyInvitations = pgTable(
  "agency_invitations",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    email: text().notNull(),
    role: text().notNull(),
    tokenHash: text("token_hash").notNull(),
    status: text().default("pending").notNull(),
    invitedByUserId: text("invited_by_user_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedUserId: text("accepted_user_id"),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agency_invitations_agency_idx").using(
      "btree",
      table.agencyId,
      table.status,
    ),
    uniqueIndex("agency_invitations_token_idx").using("btree", table.tokenHash),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_invitations_agency_id_agencies_id_fk",
    }).onDelete("cascade"),
  ],
);

export const agencyReviewReplies = pgTable(
  "agency_review_replies",
  {
    id: text().primaryKey().notNull(),
    reviewId: text("review_id").notNull(),
    agencyId: text("agency_id").notNull(),
    body: text().notNull(),
    authorUserId: text("author_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agency_review_replies_agency_idx").using("btree", table.agencyId),
    uniqueIndex("agency_review_replies_review_idx").using(
      "btree",
      table.reviewId,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_review_replies_agency_id_agencies_id_fk",
    }),
  ],
);

export const agencySettings = pgTable(
  "agency_settings",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    bookingMode: text("booking_mode").default("request").notNull(),
    instantEnabled: boolean("instant_enabled").default(false).notNull(),
    publicSlug: text("public_slug"),
    publicHeadlineEn: text("public_headline_en"),
    publicHeadlineFr: text("public_headline_fr"),
    publicBodyEn: text("public_body_en"),
    publicBodyFr: text("public_body_fr"),
    contractRef: text("contract_ref"),
    contractStatus: text("contract_status").default("draft").notNull(),
    version: integer().default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agency_settings_slug_idx").using("btree", table.publicSlug),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "agency_settings_agency_id_agencies_id_fk",
    }).onDelete("cascade"),
    unique("agency_settings_agency_id_unique").on(table.agencyId),
  ],
);

export const bookingIssues = pgTable(
  "booking_issues",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id").notNull(),
    agencyId: text("agency_id").notNull(),
    kind: text().notNull(),
    severity: text().default("medium").notNull(),
    status: text().default("open").notNull(),
    summary: text().notNull(),
    details: text(),
    openedByUserId: text("opened_by_user_id"),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("booking_issues_agency_idx").using(
      "btree",
      table.agencyId,
      table.status,
    ),
    index("booking_issues_booking_idx").using(
      "btree",
      table.bookingId,
      table.status,
    ),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "booking_issues_booking_id_bookings_id_fk",
    }),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "booking_issues_agency_id_agencies_id_fk",
    }),
  ],
);

export const claims = pgTable(
  "claims",
  {
    id: text().primaryKey().notNull(),
    bookingId: text("booking_id"),
    agencyId: text("agency_id"),
    customerProfileId: text("customer_profile_id"),
    status: text().default("open").notNull(),
    claimType: text("claim_type").default("damage").notNull(),
    amountClaimedMillimes: bigint("amount_claimed_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    amountApprovedMillimes: bigint("amount_approved_millimes", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    touchesDeposit: boolean("touches_deposit").default(true).notNull(),
    summary: text().notNull(),
    ownerUserId: text("owner_user_id"),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("claims_booking_idx").using("btree", table.bookingId),
    index("claims_status_idx").using("btree", table.status, table.updatedAt),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "claims_booking_id_bookings_id_fk",
    }),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "claims_agency_id_agencies_id_fk",
    }),
  ],
);

export const claimNotes = pgTable(
  "claim_notes",
  {
    id: text().primaryKey().notNull(),
    claimId: text("claim_id").notNull(),
    authorUserId: text("author_user_id").notNull(),
    body: text().notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("claim_notes_claim_idx").using(
      "btree",
      table.claimId,
      table.createdAt,
    ),
    foreignKey({
      columns: [table.claimId],
      foreignColumns: [claims.id],
      name: "claim_notes_claim_id_claims_id_fk",
    }).onDelete("cascade"),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id"),
    bookingId: text("booking_id"),
    kind: text().default("commission").notNull(),
    status: text().default("draft").notNull(),
    currency: text().default("TND").notNull(),
    subtotalMillimes: bigint("subtotal_millimes", { mode: "bigint" }).notNull(),
    taxMillimes: bigint("tax_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    totalMillimes: bigint("total_millimes", { mode: "bigint" }).notNull(),
    includesDeposit: boolean("includes_deposit").default(false).notNull(),
    pdfObjectId: text("pdf_object_id"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    version: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoices_agency_idx").using("btree", table.agencyId, table.status),
    index("invoices_booking_idx").using("btree", table.bookingId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "invoices_agency_id_agencies_id_fk",
    }),
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "invoices_booking_id_bookings_id_fk",
    }),
  ],
);
