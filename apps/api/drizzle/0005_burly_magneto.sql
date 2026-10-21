ALTER TABLE "guests" ADD COLUMN "is_rombongan" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "guests" SET "is_rombongan" = true WHERE "quota" > 1;
