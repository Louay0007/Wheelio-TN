import { createHmac } from "node:crypto"
import { getEnv } from "@/server/core/env"
import { unauthorized } from "@/server/core/errors/app-error"
import { signWebhookBody, verifyWebhookSignature } from "./webhook-auth"

export {
  signWebhookBody,
  verifyWebhookSignature,
} from "./webhook-auth"

/**
 * Signed stub client secret: `stub_<intentId>.<hmac>`
 * HMAC over `intentId:amountMillimes` with PAYMENT_WEBHOOK_SECRET.
 */
export function signPaymentClientSecret(
  intentId: string,
  amountMillimes: string,
) {
  const secret = getEnv().PAYMENT_WEBHOOK_SECRET
  const sig = createHmac("sha256", secret)
    .update(`${intentId}:${amountMillimes}`)
    .digest("hex")
  return `stub_${intentId}.${sig}`
}

export function verifyPaymentClientSecret(
  clientSecret: string,
  intentId: string,
  amountMillimes: string,
) {
  const expected = signPaymentClientSecret(intentId, amountMillimes)
  if (clientSecret !== expected) {
    throw unauthorized("Invalid payment client secret")
  }
}

/** Build a signed webhook body for the stub provider confirm path. */
export function buildSignedCaptureWebhook(input: {
  intentId: string
  amountMillimes: string
  providerTransactionId: string
}) {
  const body = JSON.stringify({
    providerTransactionId: input.providerTransactionId,
    intentId: input.intentId,
    type: "capture",
    amountMillimes: input.amountMillimes,
    status: "succeeded",
  })
  return {
    body,
    signature: `sha256=${signWebhookBody(body)}`,
  }
}
