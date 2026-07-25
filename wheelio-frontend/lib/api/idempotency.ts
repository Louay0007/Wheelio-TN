const IDEMPOTENCY_PREFIX = "wheelio:idempotency:"

export function createIdempotencyKey() {
  return crypto.randomUUID()
}

export function getOrCreateIdempotencyKey(operation: string) {
  if (typeof sessionStorage === "undefined") return createIdempotencyKey()
  const storageKey = `${IDEMPOTENCY_PREFIX}${operation}`
  const existing = sessionStorage.getItem(storageKey)
  if (existing) return existing
  const key = createIdempotencyKey()
  sessionStorage.setItem(storageKey, key)
  return key
}

export function clearIdempotencyKey(operation: string) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(`${IDEMPOTENCY_PREFIX}${operation}`)
  }
}
