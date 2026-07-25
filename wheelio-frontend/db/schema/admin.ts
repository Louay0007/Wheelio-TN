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

export const dualControlRequests = pgTable(
  "dual_control_requests",
  {
    id: text().primaryKey().notNull(),
    actionKind: text("action_kind").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    payloadJson: jsonb("payload_json").notNull(),
    payloadHash: text("payload_hash").notNull(),
    requesterUserId: text("requester_user_id").notNull(),
    approverUserId: text("approver_user_id"),
    status: text().default("pending").notNull(),
    reason: text().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    executionResult: text("execution_result"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("dual_control_requests_status_idx").using(
      "btree",
      table.status,
      table.expiresAt,
    ),
  ],
);

export const ledgerTransactions = pgTable(
  "ledger_transactions",
  {
    id: text().primaryKey().notNull(),
    type: text().notNull(),
    bookingId: text("booking_id"),
    description: text().notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("ledger_transactions_idempotency_key_unique").on(
      table.idempotencyKey,
    ),
  ],
);

export const ledgerAccounts = pgTable(
  "ledger_accounts",
  {
    id: text().primaryKey().notNull(),
    code: text().notNull(),
    ownerType: text("owner_type").notNull(),
    ownerId: text("owner_id"),
    currency: text().default("TND").notNull(),
    accountClass: text("account_class").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("ledger_accounts_code_unique").on(table.code)],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: text().primaryKey().notNull(),
    transactionId: text("transaction_id").notNull(),
    accountId: text("account_id").notNull(),
    debitMillimes: bigint("debit_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    creditMillimes: bigint("credit_millimes", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
  },
  (table) => [
    index("ledger_entries_tx_idx").using("btree", table.transactionId),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [ledgerTransactions.id],
      name: "ledger_entries_transaction_id_ledger_transactions_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [ledgerAccounts.id],
      name: "ledger_entries_account_id_ledger_accounts_id_fk",
    }),
  ],
);
