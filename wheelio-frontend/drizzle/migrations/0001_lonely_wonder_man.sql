CREATE TABLE "consent_events" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_type" text DEFAULT 'customer' NOT NULL,
	"subject_id" text NOT NULL,
	"consent_type" text NOT NULL,
	"consent_version" text NOT NULL,
	"granted" boolean NOT NULL,
	"source" text DEFAULT 'account' NOT NULL,
	"ip_address" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"principal_type" text NOT NULL,
	"principal_id" text NOT NULL,
	"event_key" text NOT NULL,
	"channel" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_profile_id" text NOT NULL,
	"request_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_at" timestamp with time zone,
	"legal_hold_reason" text,
	"artifact_object_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "saved_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_profile_id" text NOT NULL,
	"offer_id" text NOT NULL,
	"offer_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_profile_id" text NOT NULL,
	"label" text,
	"query_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"trade_name" text NOT NULL,
	"legal_name" text NOT NULL,
	"city" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"verification_status" text DEFAULT 'draft' NOT NULL,
	"commission_tier_bps" integer DEFAULT 1200 NOT NULL,
	"booking_mode" text DEFAULT 'request' NOT NULL,
	"instant_enabled" boolean DEFAULT false NOT NULL,
	"public_visibility" boolean DEFAULT false NOT NULL,
	"logo_url" text,
	"rating_average_bps" integer DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_profiles_i18n" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"locale" text NOT NULL,
	"public_name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"pickup_description" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"location_id" text NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"blurb" text NOT NULL,
	"intro" text NOT NULL,
	"pickup_tips_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faqs_json" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"region" text NOT NULL,
	"search_pickup" text NOT NULL,
	"starting_from_millimes" integer,
	"status" text DEFAULT 'published' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text,
	"customer_user_id" text,
	"agency_id" text NOT NULL,
	"location_id" text,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"author_display_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"attributes_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_category_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"locale" text NOT NULL,
	"label" text NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"who_for" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "extras_interests" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_offers" ADD CONSTRAINT "saved_offers_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_profiles_i18n" ADD CONSTRAINT "agency_profiles_i18n_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_translations" ADD CONSTRAINT "location_translations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_category_translations" ADD CONSTRAINT "vehicle_category_translations_category_id_vehicle_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."vehicle_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_events_subject_idx" ON "consent_events" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "consent_events_type_idx" ON "consent_events" USING btree ("consent_type","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_unique_idx" ON "notification_preferences" USING btree ("principal_type","principal_id","event_key","channel");--> statement-breakpoint
CREATE INDEX "privacy_requests_customer_idx" ON "privacy_requests" USING btree ("customer_profile_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_offers_unique_idx" ON "saved_offers" USING btree ("customer_profile_id","offer_id");--> statement-breakpoint
CREATE INDEX "saved_searches_customer_idx" ON "saved_searches" USING btree ("customer_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agencies_slug_idx" ON "agencies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agencies_public_idx" ON "agencies" USING btree ("public_visibility","verification_status");--> statement-breakpoint
CREATE INDEX "agencies_city_idx" ON "agencies" USING btree ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_profiles_i18n_unique_idx" ON "agency_profiles_i18n" USING btree ("agency_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "location_translations_unique_idx" ON "location_translations" USING btree ("location_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "locations_status_idx" ON "locations" USING btree ("status","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_booking_unique_idx" ON "reviews" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "reviews_agency_status_idx" ON "reviews" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "reviews_location_status_idx" ON "reviews" USING btree ("location_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_categories_code_idx" ON "vehicle_categories" USING btree ("code");--> statement-breakpoint
CREATE INDEX "vehicle_categories_active_idx" ON "vehicle_categories" USING btree ("active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_category_translations_unique_idx" ON "vehicle_category_translations" USING btree ("category_id","locale");