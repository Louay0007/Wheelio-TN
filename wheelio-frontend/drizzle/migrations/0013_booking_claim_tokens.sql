CREATE TABLE "booking_claim_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "token_hash" text NOT NULL,
  "booking_id" text NOT NULL,
  "email" text NOT NULL,
  "requested_account_user_id" text,
  "claimed_by_user_id" text,
  "booking_version" integer NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 5 NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "booking_claim_tokens_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX "booking_claim_tokens_hash_idx" ON "booking_claim_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "booking_claim_tokens_booking_idx" ON "booking_claim_tokens" USING btree ("booking_id","created_at");--> statement-breakpoint
CREATE INDEX "booking_claim_tokens_expiry_idx" ON "booking_claim_tokens" USING btree ("expires_at");
