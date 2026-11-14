CREATE TABLE "doorprize_prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doorprize_prizes_quantity_valid" CHECK ("doorprize_prizes"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "doorprize_winners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prize_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"drawn_at" timestamp with time zone DEFAULT now() NOT NULL,
	"forfeited_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "doorprize_winners" ADD CONSTRAINT "doorprize_winners_prize_id_doorprize_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."doorprize_prizes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doorprize_winners" ADD CONSTRAINT "doorprize_winners_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "doorprize_winners_guest_unique" ON "doorprize_winners" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "doorprize_winners_prize_idx" ON "doorprize_winners" USING btree ("prize_id");