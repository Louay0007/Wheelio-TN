CREATE TABLE "admin_agency_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"visibility" text DEFAULT 'internal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_staff_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_user_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_review_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"agency_id" text NOT NULL,
	"body" text NOT NULL,
	"author_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"booking_mode" text DEFAULT 'request' NOT NULL,
	"instant_enabled" boolean DEFAULT false NOT NULL,
	"public_slug" text,
	"public_headline_en" text,
	"public_headline_fr" text,
	"public_body_en" text,
	"public_body_fr" text,
	"contract_ref" text,
	"contract_status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agency_settings_agency_id_unique" UNIQUE("agency_id")
);
--> statement-breakpoint
CREATE TABLE "booking_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"agency_id" text NOT NULL,
	"kind" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"summary" text NOT NULL,
	"details" text,
	"opened_by_user_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"claim_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text,
	"agency_id" text,
	"customer_profile_id" text,
	"status" text DEFAULT 'open' NOT NULL,
	"claim_type" text DEFAULT 'damage' NOT NULL,
	"amount_claimed_millimes" bigint DEFAULT 0 NOT NULL,
	"amount_approved_millimes" bigint DEFAULT 0 NOT NULL,
	"touches_deposit" boolean DEFAULT true NOT NULL,
	"summary" text NOT NULL,
	"owner_user_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"audience" text DEFAULT 'all' NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text,
	"booking_id" text,
	"kind" text DEFAULT 'commission' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'TND' NOT NULL,
	"subtotal_millimes" bigint NOT NULL,
	"tax_millimes" bigint DEFAULT 0 NOT NULL,
	"total_millimes" bigint NOT NULL,
	"includes_deposit" boolean DEFAULT false NOT NULL,
	"pdf_object_id" text,
	"issued_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text NOT NULL,
	"discount_bps" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"max_redemptions" integer,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"applies_to_deposit" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "reconciliation_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'stub' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"matched_count" integer DEFAULT 0 NOT NULL,
	"unmatched_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by_user_id" text,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_agency_notes" ADD CONSTRAINT "admin_agency_notes_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_invitations" ADD CONSTRAINT "agency_invitations_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_review_replies" ADD CONSTRAINT "agency_review_replies_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_settings" ADD CONSTRAINT "agency_settings_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_issues" ADD CONSTRAINT "booking_issues_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_issues" ADD CONSTRAINT "booking_issues_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_notes" ADD CONSTRAINT "claim_notes_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_agency_notes_agency_idx" ON "admin_agency_notes" USING btree ("agency_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_staff_invitations_token_idx" ON "admin_staff_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "admin_staff_invitations_email_idx" ON "admin_staff_invitations" USING btree ("email","status");--> statement-breakpoint
CREATE INDEX "agency_invitations_agency_idx" ON "agency_invitations" USING btree ("agency_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_invitations_token_idx" ON "agency_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_review_replies_review_idx" ON "agency_review_replies" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "agency_review_replies_agency_idx" ON "agency_review_replies" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "agency_settings_slug_idx" ON "agency_settings" USING btree ("public_slug");--> statement-breakpoint
CREATE INDEX "booking_issues_booking_idx" ON "booking_issues" USING btree ("booking_id","status");--> statement-breakpoint
CREATE INDEX "booking_issues_agency_idx" ON "booking_issues" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "claim_notes_claim_idx" ON "claim_notes" USING btree ("claim_id","created_at");--> statement-breakpoint
CREATE INDEX "claims_status_idx" ON "claims" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "claims_booking_idx" ON "claims" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "feature_flags_enabled_idx" ON "feature_flags" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "invoices_agency_idx" ON "invoices" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "invoices_booking_idx" ON "invoices" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "promotions_status_idx" ON "promotions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reconciliation_runs_status_idx" ON "reconciliation_runs" USING btree ("status");