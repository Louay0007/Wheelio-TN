import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { getEnv } from "@/server/core/env"
import * as schema from "@/db/schema"
import * as relations from "@/db/relations"

const fullSchema = { ...schema, ...relations }

export type Database = ReturnType<typeof createDb>

let client: ReturnType<typeof postgres> | null = null
let dbInstance: Database | null = null

export function createDb(connectionString = getEnv().DATABASE_URL) {
  const sql = postgres(connectionString, {
    max: 10,
    prepare: false,
  })
  return drizzle(sql, { schema: fullSchema })
}

export function getDb(): Database {
  if (dbInstance) return dbInstance
  const connectionString = getEnv().DATABASE_URL
  client = postgres(connectionString, {
    max: 10,
    prepare: false,
  })
  dbInstance = drizzle(client, { schema: fullSchema })
  return dbInstance
}

export async function closeDb() {
  if (client) {
    await client.end({ timeout: 5 })
    client = null
    dbInstance = null
  }
}

export { fullSchema }
