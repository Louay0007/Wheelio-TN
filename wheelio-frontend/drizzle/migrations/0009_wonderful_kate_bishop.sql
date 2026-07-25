CREATE TABLE "agency_fees" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"code" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text NOT NULL,
	"amount_millimes" bigint NOT NULL,
	"mandatory" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"includes_deposit" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"user_id" text NOT NULL,
	"event_key" text NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"user_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"kind" text NOT NULL,
	"locale" text NOT NULL,
	"summary" text NOT NULL,
	"body_markdown" text DEFAULT '' NOT NULL,
	"rules_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"vehicle_id" text,
	"branch_id" text,
	"kind" text DEFAULT 'maintenance' NOT NULL,
	"label" text NOT NULL,
	"reason" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"author_class" text NOT NULL,
	"visibility" text DEFAULT 'both' NOT NULL,
	"body" text NOT NULL,
	"staff_marked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_media" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"agency_id" text NOT NULL,
	"stored_object_id" text NOT NULL,
	"kind" text DEFAULT 'photo' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"caption" text,
	"moderation_state" text DEFAULT 'pending' NOT NULL,
	"public_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agency_fees" ADD CONSTRAINT "agency_fees_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_notification_preferences" ADD CONSTRAINT "agency_notification_preferences_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_notifications" ADD CONSTRAINT "agency_notifications_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_policies" ADD CONSTRAINT "agency_policies_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_blocks" ADD CONSTRAINT "availability_blocks_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_blocks" ADD CONSTRAINT "availability_blocks_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_messages" ADD CONSTRAINT "booking_messages_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_media" ADD CONSTRAINT "vehicle_media_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_media" ADD CONSTRAINT "vehicle_media_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_media" ADD CONSTRAINT "vehicle_media_stored_object_id_stored_objects_id_fk" FOREIGN KEY ("stored_object_id") REFERENCES "public"."stored_objects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agency_fees_code_idx" ON "agency_fees" USING btree ("agency_id","code");--> statement-breakpoint
CREATE INDEX "agency_fees_agency_idx" ON "agency_fees" USING btree ("agency_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_notif_prefs_unique_idx" ON "agency_notification_preferences" USING btree ("agency_id","user_id","event_key");--> statement-breakpoint
CREATE INDEX "agency_notifications_agency_idx" ON "agency_notifications" USING btree ("agency_id","created_at");--> statement-breakpoint
CREATE INDEX "agency_notifications_user_idx" ON "agency_notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_policies_unique_idx" ON "agency_policies" USING btree ("agency_id","kind","locale");--> statement-breakpoint
CREATE INDEX "availability_blocks_agency_idx" ON "availability_blocks" USING btree ("agency_id","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "availability_blocks_vehicle_idx" ON "availability_blocks" USING btree ("vehicle_id","starts_at");--> statement-breakpoint
CREATE INDEX "booking_messages_booking_idx" ON "booking_messages" USING btree ("booking_id","created_at");--> statement-breakpoint
CREATE INDEX "vehicle_media_vehicle_idx" ON "vehicle_media" USING btree ("vehicle_id","sort_order");--> statement-breakpoint
CREATE INDEX "vehicle_media_agency_idx" ON "vehicle_media" USING btree ("agency_id");