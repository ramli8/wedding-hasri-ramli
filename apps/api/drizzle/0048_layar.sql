CREATE TABLE "layar_config" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"portions_ready" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "layar_config_singleton" CHECK ("layar_config"."id" = 1),
	CONSTRAINT "layar_config_portions_valid" CHECK ("layar_config"."portions_ready" >= 0)
);
--> statement-breakpoint
ALTER TABLE "devices" DROP CONSTRAINT "devices_kind_valid";--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_kind_valid" CHECK ("devices"."kind" in ('scanner', 'booth', 'buwuh', 'layar'));