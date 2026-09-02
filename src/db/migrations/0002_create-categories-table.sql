CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"status" varchar(250) DEFAULT 'Active' NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
ALTER TABLE "flowers" ADD COLUMN "name" varchar(255) NOT NULL;
ALTER TABLE "flowers" ADD COLUMN "slug" varchar(255) NOT NULL;
ALTER TABLE "flowers" ADD COLUMN "category_id" integer NOT NULL;
ALTER TABLE "flowers" ADD COLUMN "image_url" varchar(500);
ALTER TABLE "flowers" ADD COLUMN "thumbnail_url" varchar(500);
ALTER TABLE "flowers" ADD COLUMN "short_description" varchar(255);
ALTER TABLE "flowers" ADD COLUMN "description" text;
ALTER TABLE "flowers" ADD COLUMN "price" numeric(10, 2) NOT NULL;
ALTER TABLE "flowers" ADD COLUMN "compare_at_price" numeric(10, 2);
ALTER TABLE "flowers" ADD COLUMN "stock_quantity" integer DEFAULT 0 NOT NULL;
ALTER TABLE "flowers" ADD COLUMN "sku" varchar(100);
ALTER TABLE "flowers" ADD COLUMN "created_by" integer;
ALTER TABLE "flowers" ADD COLUMN "updated_by" integer;
ALTER TABLE "flowers" ADD COLUMN "meta_title" varchar(255);
ALTER TABLE "flowers" ADD COLUMN "meta_description" varchar(500);
ALTER TABLE "flowers" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "flowers" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "flowers" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "flowers" DROP COLUMN "product_name";
ALTER TABLE "flowers" ADD CONSTRAINT "flowers_slug_unique" UNIQUE("slug");
ALTER TABLE "flowers" ADD CONSTRAINT "flowers_sku_unique" UNIQUE("sku");