ALTER TABLE "guests" DROP CONSTRAINT "guests_quota_positive";--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "quota";--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "note";