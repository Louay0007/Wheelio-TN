ALTER TABLE "outbox_events" ADD COLUMN "processing_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "processing_by" text;--> statement-breakpoint
