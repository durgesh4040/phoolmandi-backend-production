CREATE TABLE IF NOT EXISTS "flowers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"categoryId" INTEGER NOT NULL,
	"imageUrl" TEXT,
	"thumbnailUrl" TEXT,
	"shortDescription" varchar(500),
	"description" varchar(500),
	"price" DECIMAL(10, 2),
	"compareAtPrice" DECIMAL(10, 2),
	"stockQuantity" INTEGER,
	"sku" INTEGER,
	"createdBy" INTEGER,
	"updatedBy" INTEGER,
	"metaTitle" VARCHAR(500),
	"metaDescription" VARCHAR(500),
	"createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "deletedAt" TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX IF NOT EXISTS "flowers_slug_unique" ON "flowers" ("slug");