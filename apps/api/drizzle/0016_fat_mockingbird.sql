CREATE TABLE "wishlist_claims" (
	"wish_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_claims_wish_id_guest_id_pk" PRIMARY KEY("wish_id","guest_id"),
	CONSTRAINT "wishlist_claims_qty_valid" CHECK ("wishlist_claims"."quantity" >= 1)
);
--> statement-breakpoint
ALTER TABLE "wishlist_claims" ADD CONSTRAINT "wishlist_claims_wish_id_wishlist_items_id_fk" FOREIGN KEY ("wish_id") REFERENCES "public"."wishlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_claims" ADD CONSTRAINT "wishlist_claims_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;