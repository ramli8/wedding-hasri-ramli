ALTER TABLE "vendors" DROP CONSTRAINT "vendors_amounts_valid";--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD COLUMN "kind" text DEFAULT 'cicilan' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD COLUMN "proof_media_id" uuid;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "price" bigint;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "arrival_time" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "pic_name" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "pic_phone" text;--> statement-breakpoint
-- Satu kolom harga: nilai kontrak, atau harga acuan bila kontrak belum diisi.
UPDATE "vendors" SET "price" = coalesce("contract_amount", "reference_price");--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_proof_media_id_media_id_fk" FOREIGN KEY ("proof_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_price_valid" CHECK ("vendors"."price" is null or "vendors"."price" > 0);