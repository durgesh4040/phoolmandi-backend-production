import {
    pgTable,
    serial,
    varchar,
    boolean,
    timestamp,
    integer,
} from "drizzle-orm/pg-core";

export const inquiries = pgTable("inquiries", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    productId: integer("product_id").notNull(),
    phoneNo: varchar("phone_no", { length: 20 }).notNull(),
    isPhoneVerified: boolean("is_phone_verified")
        .default(false)
        .notNull(),
    otpCode: varchar("otp_code", { length: 10 }),
    otpExpire: timestamp("otp_expire"),
    quantity: integer("quantity").notNull(),
    countryId: integer("country_id"),
    stateId: integer("state_id"),
    cityId: integer("city_id"),
    status: varchar("status", { length: 50 })
        .default("Active")
        .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdBy: integer("created_by"),
    updatedBy: integer("updated_by"),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull(),
});