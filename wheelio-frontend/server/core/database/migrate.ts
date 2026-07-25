import { migrate } from "drizzle-orm/postgres-js/migrator"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import path from "node:path"
import { getEnv } from "@/server/core/env"

async function main() {
  const env = getEnv()
  const sql = postgres(env.DATABASE_URL, { max: 1 })
  const db = drizzle(sql)
  const migrationsFolder = path.join(process.cwd(), "drizzle", "migrations")
  console.log(`Applying migrations from ${migrationsFolder}`)
  await migrate(db, { migrationsFolder })
  await sql.end({ timeout: 5 })
  console.log("Migrations applied successfully")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
