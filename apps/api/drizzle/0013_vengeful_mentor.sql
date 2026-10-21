ALTER TABLE "wishlist_items" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD COLUMN "received" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "wishlist_items" SET "received" = "quantity" WHERE "is_fulfilled";