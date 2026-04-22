import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema:    "./src/db/schema.ts",
  out:       "./drizzle",          // where migration files get generated
  dialect:   "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
