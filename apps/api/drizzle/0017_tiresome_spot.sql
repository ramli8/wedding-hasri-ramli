ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_qty_valid";--> statement-breakpoint
ALTER TABLE "wishlist_items" DROP COLUMN "received";--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_qty_valid" CHECK ("wishlist_items"."quantity" >= 1);