CREATE TABLE "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"branch_id" text,
	"category_code" text NOT NULL,
	"plate_hash" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer,
	"status" text DEFAULT 'ready' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_agency_plate_hash_idx" ON "vehicles" USING btree ("agency_id","plate_hash");--> statement-breakpoint
CREATE INDEX "vehicles_agency_category_idx" ON "vehicles" USING btree ("agency_id","category_code","status");