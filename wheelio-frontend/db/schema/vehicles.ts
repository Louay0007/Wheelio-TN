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

export const vehicles = pgTable(
  "vehicles",
  {
    id: text().primaryKey().notNull(),
    agencyId: text("agency_id").notNull(),
    branchId: text("branch_id"),
    categoryCode: text("category_code").notNull(),
    plateHash: text("plate_hash").notNull(),
    make: text().notNull(),
    model: text().notNull(),
    year: integer(),
    status: text().default("ready").notNull(),
    visibility: text().default("public").notNull(),
    version: integer().default(1).notNull(),
    active: boolean().default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vehicles_agency_category_idx").using(
      "btree",
      table.agencyId,
      table.categoryCode,
      table.status,
    ),
    uniqueIndex("vehicles_agency_plate_hash_idx").using(
      "btree",
      table.agencyId,
      table.plateHash,
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "vehicles_agency_id_agencies_id_fk",
    }),
  ],
);
