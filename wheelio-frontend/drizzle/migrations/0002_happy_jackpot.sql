CREATE TABLE "booking_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"payload_json" jsonb NOT NULL,
	"payload_hash" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"commissionable_millimes" bigint NOT NULL,
	"commission_millimes" bigint NOT NULL,
	"agency_net_millimes" bigint NOT NULL,
	"deposit_millimes" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'TND' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_snapshots_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_user_id" text,
	"effective_user_id" text,
	"reason_code" text,
	"reason" text,
	"source" text DEFAULT 'api' NOT NULL,
	"request_id" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"customer_profile_id" text,
	"guest_email" text,
	"agency_id" text NOT NULL,
	"branch_id" text,
	"quote_id" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"confirmation_mode" text DEFAULT 'request' NOT NULL,
	"payment_mode" text DEFAULT 'pay_at_agency' NOT NULL,
	"pickup_at" timestamp with time zone NOT NULL,
	"return_at" timestamp with time zone NOT NULL,
	"sla_expires_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposit_memos" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"holder" text DEFAULT 'agency' NOT NULL,
	"amount_millimes" bigint NOT NULL,
	"currency" text DEFAULT 'TND' NOT NULL,
	"method" text,
	"status" text DEFAULT 'expected' NOT NULL,
	"external_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"agency_id" text NOT NULL,
	"vehicle_id" text,
	"pool_id" text,
	"category_code" text,
	"reserved_start" timestamp with time zone NOT NULL,
	"reserved_end" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'held' NOT NULL,
	"allocated_by_user_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_holds" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"agency_id" text NOT NULL,
	"vehicle_id" text,
	"pool_id" text,
	"reserved_start" timestamp with time zone NOT NULL,
	"reserved_end" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'held' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"payload_json" jsonb NOT NULL,
	"rental_millimes" bigint NOT NULL,
	"mandatory_fees_millimes" bigint NOT NULL,
	"extras_millimes" bigint DEFAULT 0 NOT NULL,
	"discount_millimes" bigint DEFAULT 0 NOT NULL,
	"commissionable_millimes" bigint NOT NULL,
	"agency_net_millimes" bigint NOT NULL,
	"commission_millimes" bigint NOT NULL,
	"online_due_millimes" bigint DEFAULT 0 NOT NULL,
	"desk_due_millimes" bigint DEFAULT 0 NOT NULL,
	"deposit_millimes" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'TND' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_snapshots_quote_id_unique" UNIQUE("quote_id")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"search_session_id" text,
	"agency_id" text NOT NULL,
	"branch_id" text,
	"category_code" text NOT NULL,
	"vehicle_id" text,
	"pickup_at" timestamp with time zone NOT NULL,
	"return_at" timestamp with time zone NOT NULL,
	"confirmation_mode" text DEFAULT 'request' NOT NULL,
	"payment_mode" text DEFAULT 'pay_at_agency' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"currency" text DEFAULT 'TND' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"branch_id" text,
	"category_code" text NOT NULL,
	"name" text NOT NULL,
	"net_daily_millimes" bigint NOT NULL,
	"minimum_days" integer DEFAULT 1 NOT NULL,
	"maximum_days" integer,
	"active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_profile_id" text,
	"anonymous_key" text,
	"query_snapshot" jsonb NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_snapshots" ADD CONSTRAINT "booking_snapshots_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_memos" ADD CONSTRAINT "deposit_memos_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_holds" ADD CONSTRAINT "inventory_holds_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_holds" ADD CONSTRAINT "inventory_holds_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_snapshots" ADD CONSTRAINT "quote_snapshots_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_search_session_id_search_sessions_id_fk" FOREIGN KEY ("search_session_id") REFERENCES "public"."search_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_sessions" ADD CONSTRAINT "search_sessions_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_status_history_booking_idx" ON "booking_status_history" USING btree ("booking_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_reference_idx" ON "bookings" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "bookings_customer_idx" ON "bookings" USING btree ("customer_profile_id","status");--> statement-breakpoint
CREATE INDEX "bookings_agency_idx" ON "bookings" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "deposit_memos_booking_idx" ON "deposit_memos" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "inventory_allocations_vehicle_idx" ON "inventory_allocations" USING btree ("vehicle_id","status","reserved_start","reserved_end");--> statement-breakpoint
CREATE INDEX "inventory_allocations_booking_idx" ON "inventory_allocations" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "inventory_holds_vehicle_idx" ON "inventory_holds" USING btree ("vehicle_id","status","reserved_start","reserved_end");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_holds_idempotency_idx" ON "inventory_holds" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "quote_snapshots_quote_idx" ON "quote_snapshots" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "quotes_agency_idx" ON "quotes" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "quotes_expires_idx" ON "quotes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "rate_plans_agency_category_idx" ON "rate_plans" USING btree ("agency_id","category_code","active");--> statement-breakpoint
CREATE INDEX "search_sessions_customer_idx" ON "search_sessions" USING btree ("customer_profile_id");--> statement-breakpoint
CREATE INDEX "search_sessions_expires_idx" ON "search_sessions" USING btree ("expires_at");