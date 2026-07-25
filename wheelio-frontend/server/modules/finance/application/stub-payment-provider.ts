import { buildSignedCaptureWebhook, signPaymentClientSecret, verifyPaymentClientSecret } from "./payment-stub"
import { handlePaymentWebhook } from "./payments"
import type { PaymentProvider } from "./payment-provider"
export const stubPaymentProvider: PaymentProvider = { name: "stub", createClientSecret: signPaymentClientSecret, async confirm(input, ctx) { verifyPaymentClientSecret(input.clientSecret, input.intentId, input.amountMillimes); const { body } = buildSignedCaptureWebhook({ intentId: input.intentId, amountMillimes: input.amountMillimes, providerTransactionId: `stub_txn_${input.intentId}` }); return handlePaymentWebhook(JSON.parse(body), ctx) } }
