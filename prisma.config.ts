import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local itself; the Prisma CLI needs it loaded explicitly.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations use the direct (non-pooled) connection. `prisma generate` needs no URL,
  // so this may be undefined during builds.
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
