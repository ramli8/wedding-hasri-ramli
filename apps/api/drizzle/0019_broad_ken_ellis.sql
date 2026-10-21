CREATE TABLE "received_gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid,
	"giver_name" text NOT NULL,
	"kind" text NOT NULL,
	"amount" bigint,
	"item_description" text,
	"note" text,
	"received_on" date NOT NULL,
	"thanked_at" timestamp with time zone,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "received_gifts_kind_valid" CHECK ("received_gifts"."kind" in ('amplop', 'transfer', 'barang')),
	CONSTRAINT "received_gifts_amount_valid" CHECK (("received_gifts"."kind" = 'barang' and "received_gifts"."item_description" is not null)
        or ("received_gifts"."kind" <> 'barang' and "received_gifts"."amount" > 0))
);
--> statement-breakpoint
ALTER TABLE "received_gifts" ADD CONSTRAINT "received_gifts_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "received_gifts" ADD CONSTRAINT "received_gifts_recorded_by_admins_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "received_gifts_received_idx" ON "received_gifts" USING btree ("received_on");