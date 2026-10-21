CREATE TABLE "invitation_cover" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"greeting" text,
	"photo_media_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_cover_singleton" CHECK ("invitation_cover"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "invitation_sections" (
	"key" text PRIMARY KEY NOT NULL,
	"sort_order" integer NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitation_cover" ADD CONSTRAINT "invitation_cover_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;