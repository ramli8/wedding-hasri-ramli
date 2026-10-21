CREATE TABLE "couple_profiles" (
	"role" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"nickname" text,
	"parents" text,
	"bio" text,
	"instagram" text,
	"photo_media_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "couple_profiles_role_valid" CHECK ("couple_profiles"."role" in ('groom', 'bride'))
);
--> statement-breakpoint
CREATE TABLE "story_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sort_order" integer NOT NULL,
	"when_label" text,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"photo_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "couple_profiles" ADD CONSTRAINT "couple_profiles_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_items" ADD CONSTRAINT "story_items_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;