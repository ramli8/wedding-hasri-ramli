CREATE TABLE "group_events" (
	"group_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	CONSTRAINT "group_events_group_id_event_id_pk" PRIMARY KEY("group_id","event_id")
);
--> statement-breakpoint
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_group_id_guest_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."guest_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Sebelumnya kelompok dianggap diundang ke semua acara: pertahankan itu untuk kelompok lama.
INSERT INTO "group_events" ("group_id", "event_id") SELECT g."id", e."id" FROM "guest_groups" g CROSS JOIN "events" e;
