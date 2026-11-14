CREATE TABLE "voice_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"duration_ms" integer NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "voice_messages_mime_valid" CHECK ("voice_messages"."mime_type" in ('audio/webm', 'audio/ogg', 'audio/mp4'))
);
--> statement-breakpoint
ALTER TABLE "voice_messages" ADD CONSTRAINT "voice_messages_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "voice_messages_guest_idx" ON "voice_messages" USING btree ("guest_id");