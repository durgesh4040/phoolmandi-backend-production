import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 })
    .notNull()
    .unique(),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  status: varchar("status", { length: 250 })
    .default("Active")
    .notNull(),
  createdBy: integer("created_by"),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true,
  }),
});