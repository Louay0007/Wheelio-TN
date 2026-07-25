import Redis from "ioredis"
import { getEnv } from "@/server/core/env"

let redis: Redis | null = null

export function getRedis() {
  if (redis) return redis
  const env = getEnv()
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  })
  return redis
}

export async function closeRedis() {
  if (!redis) return
  await redis.quit()
  redis = null
}

export async function pingRedis() {
  const result = await getRedis().ping()
  return result === "PONG"
}
