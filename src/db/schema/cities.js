// src/db/schema/cities.ts
import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
export const cities = pgTable("cities", {
    id: serial("id").primaryKey(),
    stateId: integer("state_id"),
    cityName: varchar("city_name", { length: 255 }),
    status: varchar("status", { length: 50 }),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
