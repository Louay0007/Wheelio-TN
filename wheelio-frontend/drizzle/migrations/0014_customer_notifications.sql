CREATE TABLE "customer_notifications" (
  "id" text PRIMARY KEY NOT NULL,
  "customer_profile_id" text NOT NULL,
  "type" text NOT NULL,
  "title_en" text NOT NULL,
  "title_fr" text NOT NULL,
  "body_en" text DEFAULT '' NOT NULL,
  "body_fr" text DEFAULT '' NOT NULL,
  "href" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "customer_notifications" ADD CONSTRAINT "customer_notifications_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_notifications_feed_idx" ON "customer_notifications" USING btree ("customer_profile_id","created_at","id");--> statement-breakpoint
CREATE INDEX "customer_notifications_unread_idx" ON "customer_notifications" USING btree ("customer_profile_id","created_at") WHERE "customer_notifications"."read_at" IS NULL;
