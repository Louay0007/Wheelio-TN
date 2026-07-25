import { Queue, type ConnectionOptions } from "bullmq";
import { getEnv } from "@/server/core/env";

export const QUEUE_NAMES = {
  outbox: "wheelio.outbox",
  email: "wheelio.email",
  mediaScan: "wheelio.media-scan",
  privacy: "wheelio.privacy",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

let connection: ConnectionOptions | null = null;
const queues = new Map<string, Queue>();

export function getQueueConnection(): ConnectionOptions {
  if (connection) return connection;
  const url = new URL(getEnv().REDIS_URL);
  connection = {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
    username: url.username || undefined,
    maxRetriesPerRequest: null,
  };
  return connection;
}

export function getQueue(name: QueueName) {
  const existing = queues.get(name);
  if (existing) return existing;
  const queue = new Queue(name, { connection: getQueueConnection() });
  queues.set(name, queue);
  return queue;
}

export async function enqueueJob(
  name: QueueName,
  payload: Record<string, unknown>,
  opts?: { jobId?: string; delay?: number },
) {
  const queue = getQueue(name);
  return queue.add(name, payload, {
    jobId: opts?.jobId,
    delay: opts?.delay,
    attempts: 8,
    backoff: { type: "exponential", delay: 1_000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
}
