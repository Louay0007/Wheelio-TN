import * as Minio from "minio"
import { getEnv } from "@/server/core/env"
import { getLogger } from "@/server/core/observability/logger"

let client: Minio.Client | null = null

export function getMinioClient() {
  if (client) return client
  const env = getEnv()
  client = new Minio.Client({
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: Boolean(env.MINIO_USE_SSL),
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
  })
  return client
}

export async function ensureBuckets() {
  const env = getEnv()
  const minio = getMinioClient()
  const log = getLogger()
  const buckets = [
    env.MINIO_PUBLIC_BUCKET,
    env.MINIO_PRIVATE_BUCKET,
    env.MINIO_QUARANTINE_BUCKET,
  ]
  for (const bucket of buckets) {
    const exists = await minio.bucketExists(bucket)
    if (!exists) {
      await minio.makeBucket(bucket, "us-east-1")
      log.info({ bucket }, "Created MinIO bucket")
    }
  }
}

export async function pingMinio() {
  const env = getEnv()
  const minio = getMinioClient()
  await minio.listBuckets()
  await minio.bucketExists(env.MINIO_PRIVATE_BUCKET)
  return true
}

export type UploadIntent = {
  bucket: string
  objectKey: string
  expiresSeconds: number
  url: string
}

export async function createPresignedPutUrl(opts: {
  bucket: string
  objectKey: string
  expiresSeconds?: number
}): Promise<UploadIntent> {
  const expiresSeconds = opts.expiresSeconds ?? 900
  const url = await getMinioClient().presignedPutObject(
    opts.bucket,
    opts.objectKey,
    expiresSeconds,
  )
  return {
    bucket: opts.bucket,
    objectKey: opts.objectKey,
    expiresSeconds,
    url,
  }
}

export async function createPresignedGetUrl(opts: {
  bucket: string
  objectKey: string
  expiresSeconds?: number
}) {
  const expiresSeconds = Math.min(opts.expiresSeconds ?? 300, 900)
  const url = await getMinioClient().presignedGetObject(
    opts.bucket, opts.objectKey, expiresSeconds,
  )
  return { url, expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString() }
}
