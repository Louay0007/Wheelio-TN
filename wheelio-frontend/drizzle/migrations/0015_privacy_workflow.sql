ALTER TABLE "privacy_requests" ADD COLUMN "failure_reason" text;
ALTER TABLE "privacy_requests" ADD COLUMN "processing_started_at" timestamp with time zone;
ALTER TABLE "privacy_requests" ADD COLUMN "artifact_expires_at" timestamp with time zone;
ALTER TABLE "privacy_requests" ADD COLUMN "retention_until" timestamp with time zone;
CREATE UNIQUE INDEX "privacy_requests_active_type_idx" ON "privacy_requests" USING btree ("customer_profile_id", "request_type") WHERE "status" IN ('pending', 'queued', 'processing', 'awaiting_retention');
