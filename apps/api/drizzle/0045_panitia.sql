CREATE TABLE "panitia_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "panitia_members_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "panitia_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"member_id" uuid,
	"due_on" date,
	"note" text,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "panitia_tasks" ADD CONSTRAINT "panitia_tasks_member_id_panitia_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."panitia_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "panitia_tasks_member_idx" ON "panitia_tasks" USING btree ("member_id");