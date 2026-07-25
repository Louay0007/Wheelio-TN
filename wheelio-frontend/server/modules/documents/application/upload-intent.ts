import { eq } from "drizzle-orm"
import { z } from "zod"
import { storedObjects } from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { getEnv } from "@/server/core/env"
import {
  forbidden,
  notFound,
  validationError,
} from "@/server/core/errors/app-error"
import { ensureBuckets, getMinioClient } from "@/server/core/storage/minio"

const intentSchema = z.object({
  purpose: z.enum([
    "licence",
    "compliance",
    "vehicle_media",
    "claim_evidence",
    "message_attachment",
    "avatar",
  ]),
  mimeType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
  classification: z.enum(["public", "private", "quarantine"]).default("private"),
})

export async function createUploadIntent(
  principal: EffectivePrincipal | null,
  rawInput: unknown,
) {
  const parsed = intentSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid upload intent", {
      issues: parsed.error.issues,
    })
  }
  const input = parsed.data
  const env = getEnv()
  await ensureBuckets()
  const bucket =
    input.classification === "public"
      ? env.MINIO_PUBLIC_BUCKET
      : input.classification === "quarantine"
        ? env.MINIO_QUARANTINE_BUCKET
        : env.MINIO_PRIVATE_BUCKET
  const objectId = createId("obj")
  const objectKey = `${input.purpose}/${objectId}`
  const ownerId = principal?.effectiveUserId ?? "anonymous"
  const ownerType = principal ? "user" : "anonymous"

  const db = getDb()
  await db.insert(storedObjects).values({
    id: objectId,
    bucket,
    objectKey,
    ownerType,
    ownerId,
    purpose: input.purpose,
    classification: input.classification,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    scanStatus: "pending",
  })

  const minio = getMinioClient()
  const uploadUrl = await minio.presignedPutObject(bucket, objectKey, 60 * 10)

  return {
    objectId,
    bucket,
    objectKey,
    uploadUrl,
    expiresInSeconds: 600,
    headers: {
      "Content-Type": input.mimeType,
    },
  }
}

/**
 * Finalize upload after client PUT. Local/dev stub marks scanStatus=clean
 * unless MIME looks executable (rejected).
 */
export async function finalizeUpload(
  principal: EffectivePrincipal | null,
  objectId: string,
  rawInput?: unknown,
) {
  if (principal?.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation cannot finalize uploads",
    )
  }
  const schema = z
    .object({
      checksumSha256: z.string().length(64).optional(),
    })
    .default({})
  const parsed = schema.safeParse(rawInput ?? {})
  if (!parsed.success) {
    throw validationError("Invalid finalize payload", {
      issues: parsed.error.issues,
    })
  }

  const db = getDb()
  const obj = await db.query.storedObjects.findFirst({
    where: eq(storedObjects.id, objectId),
  })
  if (!obj) throw notFound("Stored object not found")
  if (
    principal &&
    obj.ownerType === "user" &&
    obj.ownerId !== principal.effectiveUserId &&
    principal.actorClass !== "admin"
  ) {
    throw forbidden("FORBIDDEN", "Not object owner")
  }

  const dangerous =
    /executable|x-msdownload|x-sh|javascript/i.test(obj.mimeType) ||
    obj.objectKey.endsWith(".exe")
  const scanStatus = dangerous ? "rejected" : "clean"

  await db
    .update(storedObjects)
    .set({
      scanStatus,
      checksumSha256: parsed.data.checksumSha256 ?? obj.checksumSha256,
      updatedAt: new Date(),
    })
    .where(eq(storedObjects.id, objectId))

  return {
    objectId,
    scanStatus,
    purpose: obj.purpose,
    bucket: obj.bucket,
    objectKey: obj.objectKey,
  }
}
