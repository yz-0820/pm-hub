CREATE TABLE IF NOT EXISTS "rate_limits" (
  "key" text PRIMARY KEY,
  "count" integer NOT NULL,
  "reset_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_reset_at_idx" ON "rate_limits" ("reset_at");
