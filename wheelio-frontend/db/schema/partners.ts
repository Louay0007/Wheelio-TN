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

export const partnerApplications = pgTable(
  "partner_applications",
  {
    id: text().primaryKey().notNull(),
    status: text().default("new").notNull(),
    tradeName: text("trade_name").notNull(),
    legalName: text("legal_name").notNull(),
    taxIdHash: text("tax_id_hash").notNull(),
    city: text().notNull(),
    email: text().notNull(),
    phone: text().notNull(),
    fleetSizeEstimate: integer("fleet_size_estimate").default(1).notNull(),
    branchesPlanned: integer("branches_planned").default(1).notNull(),
    preferredLocale: text("preferred_locale").default("en").notNull(),
    source: text().default("partners_join").notNull(),
    assigneeUserId: text("assignee_user_id"),
    decisionReason: text("decision_reason"),
    decisionReasonCode: text("decision_reason_code"),
    resultingAgencyId: text("resulting_agency_id"),
    docsJson: jsonb("docs_json").$type<unknown[]>().default([]).notNull(),
    version: integer().default(1).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("partner_applications_email_idx").using("btree", table.email),
    index("partner_applications_status_idx").using(
      "btree",
      table.status,
      table.submittedAt,
    ),
    foreignKey({
      columns: [table.resultingAgencyId],
      foreignColumns: [agencies.id],
      name: "partner_applications_resulting_agency_id_agencies_id_fk",
    }),
  ],
);

export const partnerApplicationNotes = pgTable(
  "partner_application_notes",
  {
    id: text().primaryKey().notNull(),
    applicationId: text("application_id").notNull(),
    authorUserId: text("author_user_id").notNull(),
    body: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("partner_application_notes_app_idx").using(
      "btree",
      table.applicationId,
      table.createdAt,
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [partnerApplications.id],
      name: "partner_application_notes_application_id_partner_applications_i",
    }).onDelete("cascade"),
  ],
);
