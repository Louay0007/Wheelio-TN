CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"failed_verification_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_drivers" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_profile_id" text NOT NULL,
	"full_name" text NOT NULL,
	"age_band" text NOT NULL,
	"date_of_birth" text,
	"license_country" text NOT NULL,
	"license_number_encrypted" text,
	"license_number_hash" text,
	"license_expiry" text NOT NULL,
	"license_category" text DEFAULT 'B' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"legal_name" text NOT NULL,
	"preferred_name" text,
	"phone" text,
	"phone_normalized" text,
	"date_of_birth" text,
	"nationality" text,
	"residence_country" text,
	"address_line" text,
	"city" text,
	"preferred_locale" text DEFAULT 'en' NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"usual_pickup" text,
	"default_age_band" text,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"welcome_completed" boolean DEFAULT false NOT NULL,
	"risk_status" text DEFAULT 'clear' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "admin_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"mfa_required" integer DEFAULT 0 NOT NULL,
	"invited_by_user_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_memberships_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "agency_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"branch_scope_id" text,
	"invited_by_user_id" text,
	"accepted_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" text,
	"effective_user_id" text,
	"actor_class" text DEFAULT 'system' NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"tenant_type" text,
	"tenant_id" text,
	"reason" text,
	"ticket" text,
	"request_id" text,
	"correlation_id" text,
	"ip_address" text,
	"user_agent" text,
	"before_digest" text,
	"after_digest" text,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"principal_key" text NOT NULL,
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"state" text DEFAULT 'processing' NOT NULL,
	"status_code" integer,
	"response_body" jsonb,
	"resource_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" text PRIMARY KEY NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_version" integer DEFAULT 1 NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"correlation_id" text,
	"causation_id" text,
	"publish_attempts" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"dead_lettered_at" timestamp with time zone,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "stored_objects" (
	"id" text PRIMARY KEY NOT NULL,
	"bucket" text NOT NULL,
	"object_key" text NOT NULL,
	"owner_type" text NOT NULL,
	"owner_id" text NOT NULL,
	"purpose" text NOT NULL,
	"classification" text DEFAULT 'private' NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum_sha256" text,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"legal_hold" integer DEFAULT 0 NOT NULL,
	"retention_until" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"current_revision_id" text,
	"scheduled_publish_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_publications" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"revision_id" text NOT NULL,
	"locale" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"unpublished_at" timestamp with time zone,
	"actor_user_id" text
);
--> statement-breakpoint
CREATE TABLE "cms_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"revision" integer NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"structured_content" text,
	"author_user_id" text,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_drivers" ADD CONSTRAINT "customer_drivers_customer_profile_id_customer_profiles_id_fk" FOREIGN KEY ("customer_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_publications" ADD CONSTRAINT "cms_publications_entry_id_cms_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."cms_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_publications" ADD CONSTRAINT "cms_publications_revision_id_cms_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."cms_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_revisions_entry_id_cms_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."cms_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_user_id_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "customer_drivers_profile_idx" ON "customer_drivers" USING btree ("customer_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_drivers_one_primary_idx" ON "customer_drivers" USING btree ("customer_profile_id") WHERE "customer_drivers"."is_primary" = true AND "customer_drivers"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "customer_profiles_locale_idx" ON "customer_profiles" USING btree ("preferred_locale");--> statement-breakpoint
CREATE INDEX "admin_memberships_role_idx" ON "admin_memberships" USING btree ("role","status");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_memberships_unique_idx" ON "agency_memberships" USING btree ("agency_id","user_id");--> statement-breakpoint
CREATE INDEX "agency_memberships_user_idx" ON "agency_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_events_resource_idx" ON "audit_events" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_events_request_idx" ON "audit_events" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_unique_idx" ON "idempotency_keys" USING btree ("principal_key","scope","key");--> statement-breakpoint
CREATE INDEX "idempotency_keys_expires_idx" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "outbox_events_unpublished_idx" ON "outbox_events" USING btree ("published_at","dead_lettered_at","occurred_at");--> statement-breakpoint
CREATE INDEX "outbox_events_aggregate_idx" ON "outbox_events" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stored_objects_bucket_key_idx" ON "stored_objects" USING btree ("bucket","object_key");--> statement-breakpoint
CREATE INDEX "stored_objects_owner_idx" ON "stored_objects" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "stored_objects_scan_idx" ON "stored_objects" USING btree ("scan_status");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_entries_kind_slug_idx" ON "cms_entries" USING btree ("kind","slug");--> statement-breakpoint
CREATE INDEX "cms_entries_status_idx" ON "cms_entries" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_publications_active_idx" ON "cms_publications" USING btree ("entry_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_revisions_unique_idx" ON "cms_revisions" USING btree ("entry_id","revision","locale");--> statement-breakpoint
CREATE INDEX "cms_revisions_locale_idx" ON "cms_revisions" USING btree ("locale");