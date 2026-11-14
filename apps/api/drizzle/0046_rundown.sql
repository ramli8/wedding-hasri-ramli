CREATE TABLE "rundown_config" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"token" text NOT NULL,
	CONSTRAINT "rundown_config_singleton" CHECK ("rundown_config"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "rundown_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"time" text NOT NULL,
	"duration_min" integer,
	"title" text NOT NULL,
	"pic" text,
	"vendor_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rundown_items_time_valid" CHECK ("rundown_items"."time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);
--> statement-breakpoint
ALTER TABLE "rundown_items" ADD CONSTRAINT "rundown_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rundown_items" ADD CONSTRAINT "rundown_items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rundown_items_event_idx" ON "rundown_items" USING btree ("event_id","time");