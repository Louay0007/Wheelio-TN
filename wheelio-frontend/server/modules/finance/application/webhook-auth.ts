import { createHmac, timingSafeEqual } from "node:crypto"
import { getEnv } from "@/server/core/env"
import { unauthorized } from "@/server/core/errors/app-error"

/**
 * Stub payment provider webhook auth.
 * Header: `X-Wheelio-Webhook-Signature: sha256=<hex>`
 * Signed payload = raw request body UTF-8 bytes.
 */
export function signWebhookBody(rawBody: string, secret?: string) {
  const key = secret ?? getEnv().PAYMENT_WEBHOOK_SECRET
  return createHmac("sha256", key).update(rawBody, "utf8").digest("hex")
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
) {
  const secret = getEnv().PAYMENT_WEBHOOK_SECRET
  if (!signatureHeader) {
    throw unauthorized("Missing webhook signature")
  }
  const provided = signatureHeader.replace(/^sha256=/i, "").trim()
  const expected = signWebhookBody(rawBody, secret)
  const a = Buffer.from(provided, "hex")
  const b = Buffer.from(expected, "hex")
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw unauthorized("Invalid webhook signature")
  }
}
