CREATE TABLE "thanks_template" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"body" text NOT NULL,
	CONSTRAINT "thanks_template_singleton" CHECK ("thanks_template"."id" = 1)
);
