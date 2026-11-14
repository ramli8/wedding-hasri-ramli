CREATE TABLE "vip_config" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"token" text NOT NULL,
	CONSTRAINT "vip_config_singleton" CHECK ("vip_config"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "is_vip" boolean DEFAULT false NOT NULL;