CREATE TABLE "booth_photo_deletions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL
);
