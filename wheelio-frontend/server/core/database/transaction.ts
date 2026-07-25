import type { Database } from "./client"

export type DbTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0]

export async function withTransaction<T>(
  db: Database,
  fn: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => fn(tx))
}
