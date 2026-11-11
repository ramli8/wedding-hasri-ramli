ALTER TABLE "group_sessions" DROP CONSTRAINT "group_sessions_time_order";--> statement-breakpoint
ALTER TABLE "group_sessions" ALTER COLUMN "ends_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "countdown_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_time_order" CHECK ("group_sessions"."ends_at" is null or "group_sessions"."ends_at" > "group_sessions"."starts_at");