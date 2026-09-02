import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';
dotenv.config();
console.log(process.env.DATABASE_URL)
export default defineConfig({
  schema: "./src/db/schema/**/*.js",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});