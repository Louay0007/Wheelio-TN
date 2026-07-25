CREATE TABLE "support_case_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_application_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"trade_name" text NOT NULL,
	"legal_name" text NOT NULL,
	"tax_id_hash" text NOT NULL,
	"city" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"fleet_size_estimate" integer DEFAULT 1 NOT NULL,
	"branches_planned" integer DEFAULT 1 NOT NULL,
	"preferred_locale" text DEFAULT 'en' NOT NULL,
	"source" text DEFAULT 'partners_join' NOT NULL,
	"assignee_user_id" text,
	"decision_reason" text,
	"decision_reason_code" text,
	"resulting_agency_id" text,
	"docs_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_case_notes" ADD CONSTRAINT "support_case_notes_case_id_support_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."support_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_application_notes" ADD CONSTRAINT "partner_application_notes_application_id_partner_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."partner_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_resulting_agency_id_agencies_id_fk" FOREIGN KEY ("resulting_agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_case_notes_case_idx" ON "support_case_notes" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "partner_application_notes_app_idx" ON "partner_application_notes" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE INDEX "partner_applications_status_idx" ON "partner_applications" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE INDEX "partner_applications_email_idx" ON "partner_applications" USING btree ("email");