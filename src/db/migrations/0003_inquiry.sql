CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"phone_no" varchar(20) NOT NULL,
	"is_phone_verified" boolean DEFAULT false NOT NULL,
	"otp_code" varchar(10),
	"otp_expire" timestamp,
	"quantity" integer NOT NULL,
	"country_id" integer,
	"state_id" integer,
	"city_id" integer,
	"status" varchar(50) DEFAULT 'Active' NOT NULL,
	"deleted_at" timestamp,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
