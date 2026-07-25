import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const cmsEntries = pgTable(
  "cms_entries",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("draft"),
    currentRevisionId: text("current_revision_id"),
    scheduledPublishAt: timestamp("scheduled_publish_at", {
      withTimezone: true,
    }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("cms_entries_kind_slug_idx").on(table.kind, table.slug),
    index("cms_entries_status_idx").on(table.status),
  ],
);

export const cmsRevisions = pgTable(
  "cms_revisions",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => cmsEntries.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull(),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    structuredContent: text("structured_content"),
    authorUserId: text("author_user_id"),
    contentHash: text("content_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("cms_revisions_unique_idx").on(
      table.entryId,
      table.revision,
      table.locale,
    ),
    index("cms_revisions_locale_idx").on(table.locale),
  ],
);

export const cmsPublications = pgTable(
  "cms_publications",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => cmsEntries.id, { onDelete: "cascade" }),
    revisionId: text("revision_id")
      .notNull()
      .references(() => cmsRevisions.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    unpublishedAt: timestamp("unpublished_at", { withTimezone: true }),
    actorUserId: text("actor_user_id"),
  },
  (table) => [
    uniqueIndex("cms_publications_active_idx").on(table.entryId, table.locale),
  ],
);
