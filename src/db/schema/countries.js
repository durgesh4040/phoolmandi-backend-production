import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
export const countries = pgTable("countries", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    dialCode: varchar("dial_code", { length: 20 }),
    code: varchar("code", { length: 10 }),
    flagUrl: text("flag_url"),
    status: varchar("status", { length: 50 }).default("Active"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});