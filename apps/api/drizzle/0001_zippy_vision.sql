CREATE SEQUENCE "public"."guest_rev_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"venue_name" text,
	"address" text,
	"maps_url" text,
	"notes" text,
	"checkin_enabled" boolean DEFAULT false NOT NULL,
	"has_rsvp" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "events_time_order" CHECK ("events"."starts_at" is null or "events"."ends_at" is null or "events"."ends_at" >= "events"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "group_sessions" (
	"group_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	CONSTRAINT "group_sessions_group_id_event_id_pk" PRIMARY KEY("group_id","event_id"),
	CONSTRAINT "group_sessions_time_order" CHECK ("group_sessions"."ends_at" > "group_sessions"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "guest_events" (
	"guest_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"sent_at" timestamp with time zone,
	"sent_via" text,
	CONSTRAINT "guest_events_guest_id_event_id_pk" PRIMARY KEY("guest_id","event_id"),
	CONSTRAINT "guest_events_sent_via_valid" CHECK ("guest_events"."sent_via" is null or "guest_events"."sent_via" in ('whatsapp', 'instagram', 'other'))
);
--> statement-breakpoint
CREATE TABLE "guest_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#737373' NOT NULL,
	"is_vip" boolean DEFAULT false NOT NULL,
	"gate" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "guest_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"display_name" text NOT NULL,
	"full_name" text,
	"phone" text,
	"instagram" text,
	"group_id" uuid,
	"quota" integer DEFAULT 1 NOT NULL,
	"note" text,
	"usher_note" text,
	"source" text DEFAULT 'admin' NOT NULL,
	"rev" bigint DEFAULT nextval('guest_rev_seq') NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_code_unique" UNIQUE("code"),
	CONSTRAINT "guests_quota_positive" CHECK ("guests"."quota" >= 1),
	CONSTRAINT "guests_code_length" CHECK ("guests"."code" is null or length("guests"."code") = 6),
	CONSTRAINT "guests_source_valid" CHECK ("guests"."source" in ('admin', 'import', 'walkin')),
	CONSTRAINT "guests_has_contact" CHECK ("guests"."source" = 'walkin' or "guests"."phone" is not null or "guests"."instagram" is not null)
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_group_id_guest_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."guest_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_events" ADD CONSTRAINT "guest_events_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_events" ADD CONSTRAINT "guest_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_group_id_guest_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."guest_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guests_rev_idx" ON "guests" USING btree ("rev");--> statement-breakpoint
CREATE INDEX "guests_group_idx" ON "guests" USING btree ("group_id");