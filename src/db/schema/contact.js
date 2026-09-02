import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
export const contacts = pgTable("contact", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }).unique(),
  message:varchar("message",{length:1000}),
  createdBy: integer("created_by"),
  updatedBy: integer("updated_by"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});