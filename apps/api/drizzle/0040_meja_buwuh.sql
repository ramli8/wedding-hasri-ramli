CREATE TABLE "buwuh_config" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"catalog" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buwuh_config_singleton" CHECK ("buwuh_config"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "buwuh_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"amount" bigint DEFAULT 0 NOT NULL,
	"items" jsonb NOT NULL,
	"note" text,
	"device_id" uuid,
	"admin_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buwuh_entries_amount_valid" CHECK ("buwuh_entries"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "devices" DROP CONSTRAINT "devices_kind_valid";--> statement-breakpoint
ALTER TABLE "buwuh_entries" ADD CONSTRAINT "buwuh_entries_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buwuh_entries" ADD CONSTRAINT "buwuh_entries_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buwuh_entries_recorded_idx" ON "buwuh_entries" USING btree ("recorded_at");--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_kind_valid" CHECK ("devices"."kind" in ('scanner', 'booth', 'buwuh'));