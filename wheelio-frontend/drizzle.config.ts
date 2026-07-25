import { defineConfig } from "drizzle-kit"
import { getEnv } from "./server/core/env"

const env = getEnv()

export default defineConfig({
  schema: ["./db/schema/index.ts", "./db/relations.ts"],
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
})
