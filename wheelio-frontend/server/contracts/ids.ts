import { randomUUID } from "node:crypto"

/** Opaque public IDs (UUIDv4 for Stage 0; migrate to UUIDv7 when runtime support is universal). */
export function createId(prefix?: string) {
  const id = randomUUID()
  return prefix ? `${prefix}_${id}` : id
}

export function createRequestId() {
  return `req_${randomUUID().replace(/-/g, "").slice(0, 24)}`
}

export function createCorrelationId() {
  return `cor_${randomUUID().replace(/-/g, "").slice(0, 24)}`
}
