CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" integer,
	"city_name" varchar(255),
	"status" varchar(50),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"dial_code" varchar(20),
	"code" varchar(10),
	"flag_url" text,
	"status" varchar(50) DEFAULT 'Active',
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer,
	"state_name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'Active',
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
