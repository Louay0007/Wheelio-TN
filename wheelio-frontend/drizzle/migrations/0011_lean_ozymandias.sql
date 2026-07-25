CREATE TABLE "admin_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"kind" text DEFAULT 'info' NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"stored_object_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch_delivery_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"agency_id" text NOT NULL,
	"name" text NOT NULL,
	"fee_millimes" integer DEFAULT 0 NOT NULL,
	"radius_km" integer DEFAULT 10 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch_hours" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"agency_id" text NOT NULL,
	"weekday" integer NOT NULL,
	"open_time" text DEFAULT '08:00' NOT NULL,
	"close_time" text DEFAULT '18:00' NOT NULL,
	"closed" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fees_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text NOT NULL,
	"default_millimes" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"is_deposit" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fees_catalog_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sla_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"target_minutes" integer NOT NULL,
	"applies_to" text DEFAULT 'booking_acceptance' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sla_policies_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "agency_documents" ADD CONSTRAINT "agency_documents_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_documents" ADD CONSTRAINT "agency_documents_stored_object_id_stored_objects_id_fk" FOREIGN KEY ("stored_object_id") REFERENCES "public"."stored_objects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_delivery_zones" ADD CONSTRAINT "branch_delivery_zones_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_delivery_zones" ADD CONSTRAINT "branch_delivery_zones_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_hours" ADD CONSTRAINT "branch_hours_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_hours" ADD CONSTRAINT "branch_hours_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_notifications_user_idx" ON "admin_notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "agency_documents_agency_idx" ON "agency_documents" USING btree ("agency_id","kind");--> statement-breakpoint
CREATE INDEX "branch_delivery_branch_idx" ON "branch_delivery_zones" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "branch_hours_unique_idx" ON "branch_hours" USING btree ("branch_id","weekday");--> statement-breakpoint
CREATE INDEX "branch_hours_agency_idx" ON "branch_hours" USING btree ("agency_id");