CREATE TABLE "gift_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sort_order" integer NOT NULL,
	"kind" text NOT NULL,
	"provider" text NOT NULL,
	"account_name" text NOT NULL,
	"account_number" text NOT NULL,
	"qr_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_accounts_kind_valid" CHECK ("gift_accounts"."kind" in ('bank', 'ewallet'))
);
--> statement-breakpoint
ALTER TABLE "gift_accounts" ADD CONSTRAINT "gift_accounts_qr_media_id_media_id_fk" FOREIGN KEY ("qr_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;