ALTER TABLE "vendors" DROP CONSTRAINT "vendors_amounts_valid";--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "due_on" date;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "due_amount" bigint;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_amounts_valid" CHECK (("vendors"."reference_price" is null or "vendors"."reference_price" > 0)
        and ("vendors"."contract_amount" is null or "vendors"."contract_amount" > 0)
        and ("vendors"."due_amount" is null or "vendors"."due_amount" > 0));