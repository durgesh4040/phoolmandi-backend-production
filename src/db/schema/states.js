// src/db/schema/states.ts
import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const states = pgTable("states", {
    id: serial("id").primaryKey(), // or "Id" if you kept Sequelize naming
    countryId: integer("country_id"),
    stateName: varchar("state_name", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).default("Active"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
