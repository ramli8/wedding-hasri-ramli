CREATE TABLE "booth_config" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"frames" text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booth_config_singleton" CHECK ("booth_config"."id" = 1),
	CONSTRAINT "booth_config_frames_not_empty" CHECK (cardinality("booth_config"."frames") > 0)
);
--> statement-breakpoint
CREATE TABLE "booth_photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"media_id" uuid NOT NULL,
	"frame" text NOT NULL,
	"device_id" uuid,
	"taken_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booth_photos_mediaId_unique" UNIQUE("media_id"),
	CONSTRAINT "booth_photos_frame_valid" CHECK ("booth_photos"."frame" in ('poster', 'strip', 'tiket'))
);
--> statement-breakpoint
ALTER TABLE "booth_photos" ADD CONSTRAINT "booth_photos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booth_photos" ADD CONSTRAINT "booth_photos_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booth_photos_taken_at_idx" ON "booth_photos" USING btree ("taken_at");