import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 })
    .notNull()
    .unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isEmailVerified: boolean("is_email_verified")
    .default(false)
    .notNull(),
  isPhoneVerified: boolean("is_phone_verified")
    .default(false)
    .notNull(),
  otpCode: varchar("otp_code", { length: 10 }),
  otpExpire: varchar("otp_expire", { length: 100 }),
  token: varchar("token", { length: 500 }),
  userRole: varchar("user_role", { length: 50 }),
  status: varchar("status", { length: 50 })
    .default("Active")
    .notNull(),
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