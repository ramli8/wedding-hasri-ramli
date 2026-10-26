ALTER TABLE "settings" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "seo_image_media_id" uuid;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_seo_image_media_id_media_id_fk" FOREIGN KEY ("seo_image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;