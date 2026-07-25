CREATE TABLE "agency_onboarding_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"step" text NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_rollups" (
	"id" text PRIMARY KEY NOT NULL,
	"metric_key" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"dimensions_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"value_millimes" bigint,
	"value_count" integer,
	"includes_deposit" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_modification_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"proposed_snapshot" jsonb NOT NULL,
	"price_difference_millimes" bigint DEFAULT 0 NOT NULL,
	"deposit_difference_millimes" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"actor_user_id" text,
	"decision" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"location_id" text,
	"name" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"address_line" text,
	"city" text NOT NULL,
	"lat" text,
	"lng" text,
	"timezone" text DEFAULT 'Africa/Tunis' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"public_visible" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handover_records" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"odometer" integer,
	"fuel_level" text,
	"condition_notes" text,
	"desk_collected_millimes" bigint DEFAULT 0 NOT NULL,
	"deposit_memo_millimes" bigint DEFAULT 0 NOT NULL,
	"actor_user_id" text,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "handover_records_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "impersonation_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text NOT NULL,
	"ticket" text,
	"allowed_scopes_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"stopped_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"provider" text DEFAULT 'stub' NOT NULL,
	"provider_reference" text,
	"purpose" text DEFAULT 'rental' NOT NULL,
	"amount_millimes" bigint NOT NULL,
	"currency" text DEFAULT 'TND' NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"expires_at" timestamp with time zone,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"intent_id" text NOT NULL,
	"provider_transaction_id" text,
	"type" text NOT NULL,
	"amount_millimes" bigint NOT NULL,
	"status" text NOT NULL,
	"raw_receipt_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_millimes" bigint DEFAULT 0 NOT NULL,
	"hold_reason" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_items" (
	"id" text PRIMARY KEY NOT NULL,
	"payout_id" text NOT NULL,
	"booking_id" text,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"amount_millimes" bigint NOT NULL,
	"includes_deposit" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "return_records" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"odometer" integer,
	"fuel_level" text,
	"condition_notes" text,
	"proposed_charges_millimes" bigint DEFAULT 0 NOT NULL,
	"deposit_release_millimes" bigint DEFAULT 0 NOT NULL,
	"actor_user_id" text,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "return_records_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "vehicle_pools" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"branch_id" text,
	"category_code" text NOT NULL,
	"name" text NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"allocation_mode" text DEFAULT 'pool' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "debit_millimes" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "debit_millimes" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "credit_millimes" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "credit_millimes" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "agency_onboarding_steps" ADD CONSTRAINT "agency_onboarding_steps_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_modification_requests" ADD CONSTRAINT "booking_modification_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handover_records" ADD CONSTRAINT "handover_records_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_grants" ADD CONSTRAINT "impersonation_grants_admin_user_id_user_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_intent_id_payment_intents_id_fk" FOREIGN KEY ("intent_id") REFERENCES "public"."payment_intents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_payout_id_payout_batches_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payout_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_records" ADD CONSTRAINT "return_records_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_pools" ADD CONSTRAINT "vehicle_pools_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agency_onboarding_steps_unique_idx" ON "agency_onboarding_steps" USING btree ("agency_id","step");--> statement-breakpoint
CREATE INDEX "analytics_rollups_metric_idx" ON "analytics_rollups" USING btree ("metric_key","period_start","period_end");--> statement-breakpoint
CREATE INDEX "booking_modification_requests_booking_idx" ON "booking_modification_requests" USING btree ("booking_id","status");--> statement-breakpoint
CREATE INDEX "branches_agency_idx" ON "branches" USING btree ("agency_id","active");--> statement-breakpoint
CREATE INDEX "impersonation_grants_admin_idx" ON "impersonation_grants" USING btree ("admin_user_id","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_intents_idempotency_idx" ON "payment_intents" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payment_intents_booking_idx" ON "payment_intents" USING btree ("booking_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_transactions_provider_idx" ON "payment_transactions" USING btree ("provider_transaction_id");--> statement-breakpoint
CREATE INDEX "payout_batches_agency_idx" ON "payout_batches" USING btree ("agency_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_items_source_unique_idx" ON "payout_items" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "payout_items_payout_idx" ON "payout_items" USING btree ("payout_id");--> statement-breakpoint
CREATE INDEX "vehicle_pools_agency_category_idx" ON "vehicle_pools" USING btree ("agency_id","category_code","active");