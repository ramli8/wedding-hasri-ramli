CREATE TABLE "checkin_events" (
	"seq" bigserial NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"guest_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"target_id" uuid,
	"pax" integer,
	"method" text,
	"device_id" uuid,
	"admin_id" uuid,
	"scanned_at" timestamp with time zone NOT NULL,
	"device_time" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"outside_session" boolean DEFAULT false NOT NULL,
	CONSTRAINT "checkin_events_kind_valid" CHECK ("checkin_events"."kind" in ('checkin', 'undo', 'set_pax')),
	CONSTRAINT "checkin_events_shape" CHECK (("checkin_events"."kind" = 'checkin' and "checkin_events"."pax" >= 1 and "checkin_events"."method" is not null and "checkin_events"."target_id" is null)
        or ("checkin_events"."kind" = 'undo' and "checkin_events"."target_id" is not null)
        or ("checkin_events"."kind" = 'set_pax' and "checkin_events"."target_id" is not null and "checkin_events"."pax" >= 1))
);
--> statement-breakpoint
CREATE TABLE "checkin_reviews" (
	"guest_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"resolution" text NOT NULL,
	"note" text,
	"resolved_by" uuid NOT NULL,
	"resolved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkin_reviews_guest_id_event_id_pk" PRIMARY KEY("guest_id","event_id"),
	CONSTRAINT "checkin_reviews_resolution_valid" CHECK ("checkin_reviews"."resolution" in ('keep_first', 'merge_pax'))
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"pairing_code_hash" text,
	"pairing_expires_at" timestamp with time zone,
	"token_hash" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"app_version" text,
	"protocol_version" integer,
	"last_seen_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"pending_outbox" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devices_pairing_code_hash_unique" UNIQUE("pairing_code_hash"),
	CONSTRAINT "devices_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "devices_status_valid" CHECK ("devices"."status" in ('pending', 'active', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "checkin_events" ADD CONSTRAINT "checkin_events_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_events" ADD CONSTRAINT "checkin_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_events" ADD CONSTRAINT "checkin_events_target_id_checkin_events_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."checkin_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_events" ADD CONSTRAINT "checkin_events_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_events" ADD CONSTRAINT "checkin_events_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_reviews" ADD CONSTRAINT "checkin_reviews_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_reviews" ADD CONSTRAINT "checkin_reviews_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_reviews" ADD CONSTRAINT "checkin_reviews_resolved_by_admins_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkin_events_seq_idx" ON "checkin_events" USING btree ("seq");--> statement-breakpoint
CREATE INDEX "checkin_events_guest_idx" ON "checkin_events" USING btree ("guest_id","event_id","scanned_at");