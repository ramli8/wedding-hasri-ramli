CREATE TABLE "seserahan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"pic" text,
	"price" bigint,
	"status" text DEFAULT 'rencana' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seserahan_items_category_valid" CHECK ("seserahan_items"."category" in ('mahar', 'seserahan', 'hantaran')),
	CONSTRAINT "seserahan_items_status_valid" CHECK ("seserahan_items"."status" in ('rencana', 'dibeli', 'dikemas', 'diserahkan')),
	CONSTRAINT "seserahan_items_price_valid" CHECK ("seserahan_items"."price" is null or "seserahan_items"."price" >= 0)
);
