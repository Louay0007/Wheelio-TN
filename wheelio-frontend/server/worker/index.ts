import { Worker } from "bullmq"
import { getEnv } from "@/server/core/env"
import { closeDb, getDb } from "@/server/core/database/client"
import { getLogger } from "@/server/core/observability/logger"
import { getQueueConnection, QUEUE_NAMES } from "@/server/core/queue/bullmq"
import { closeRedis, pingRedis } from "@/server/core/queue/redis"
import {
  claimUnpublishedOutbox,
  markOutboxFailed,
  markOutboxPublished,
} from "@/server/modules/audit/infrastructure/outbox-repository"
import { ensureBuckets } from "@/server/core/storage/minio"
import { sendEmail } from "@/server/core/email/transport"
import { finalizeExpiredPrivacyRetentions, processPrivacyRequest } from "@/server/modules/customers/application/privacy-worker"

const log = getLogger()

async function publishOutboxBatch() {
  const db = getDb()
  const events = await claimUnpublishedOutbox(db, 50)
  for (const event of events) {
    try {
      // Stage 0: log + mark published. Later stages fan-out to domain handlers.
      log.info(
        {
          eventId: event.id,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
        },
        "Outbox event published",
      )
      await markOutboxPublished(db, event.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const deadLetter = event.publishAttempts + 1 >= 10
      await markOutboxFailed(db, event.id, message, deadLetter)
      log.error({ err: error, eventId: event.id }, "Outbox publish failed")
    }
  }
  return events.length
}

async function main() {
  const env = getEnv()
  log.info({ concurrency: env.WORKER_CONCURRENCY }, "Starting Wheelio worker")

  await pingRedis()
  await ensureBuckets().catch((error) => {
    log.warn({ err: error }, "MinIO bucket ensure skipped/failed")
  })

  const connection = getQueueConnection()

  const outboxWorker = new Worker(
    QUEUE_NAMES.outbox,
    async () => {
      const count = await publishOutboxBatch()
      return { processed: count }
    },
    { connection, concurrency: 1 },
  )

  const emailWorker = new Worker(
    QUEUE_NAMES.email,
    async (job) => {
      const data = job.data as {
        to: string
        subject: string
        text: string
        html?: string
      }
      await sendEmail(data)
    },
    { connection, concurrency: env.WORKER_CONCURRENCY },
  )

  const mediaWorker = new Worker(
    QUEUE_NAMES.mediaScan,
    async (job) => {
      log.info({ jobId: job.id, data: job.data }, "Media scan stub")
      return { status: "accepted" }
    },
    { connection, concurrency: 1 },
  )

  const privacyWorker = new Worker(
    QUEUE_NAMES.privacy,
    async (job) => processPrivacyRequest(String(job.data.requestId)),
    { connection, concurrency: Math.max(1, Math.min(env.WORKER_CONCURRENCY, 3)) },
  )

  // Periodic outbox drain even without explicit enqueue.
  const timer = setInterval(() => {
    publishOutboxBatch().catch((error) => {
      log.error({ err: error }, "Scheduled outbox drain failed")
    })
  }, 5_000)
  const privacyRetentionTimer = setInterval(() => {
    finalizeExpiredPrivacyRetentions().catch((error) => {
      log.error({ err: error }, "Privacy retention finalization failed")
    })
  }, 60 * 60 * 1000)

  const shutdown = async (signal: string) => {
    log.info({ signal }, "Shutting down worker")
    clearInterval(timer)
    clearInterval(privacyRetentionTimer)
    await Promise.all([
      outboxWorker.close(),
      emailWorker.close(),
      mediaWorker.close(),
      privacyWorker.close(),
    ])
    await closeRedis()
    await closeDb()
    process.exit(0)
  }

  process.on("SIGINT", () => void shutdown("SIGINT"))
  process.on("SIGTERM", () => void shutdown("SIGTERM"))

  log.info("Worker ready")
}

main().catch((error) => {
  log.fatal({ err: error }, "Worker crashed")
  process.exit(1)
})
