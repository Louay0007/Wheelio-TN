CREATE TABLE "refund_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text NOT NULL,
	"customer_amount_millimes" bigint NOT NULL,
	"agency_clawback_millimes" bigint DEFAULT 0 NOT NULL,
	"wheelio_absorbs_millimes" bigint DEFAULT 0 NOT NULL,
	"includes_deposit" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"booking_id" text,
	"agency_id" text,
	"customer_profile_id" text,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"tags_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"owner_user_id" text,
	"body" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refund_requests_booking_idx" ON "refund_requests" USING btree ("booking_id","status");--> statement-breakpoint
CREATE INDEX "support_cases_status_idx" ON "support_cases" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "support_cases_booking_idx" ON "support_cases" USING btree ("booking_id");