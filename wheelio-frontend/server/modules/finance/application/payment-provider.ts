import type { RequestContext } from "@/server/core/http/request-context"
export type PaymentProvider = { readonly name: string; createClientSecret(intentId: string, amountMillimes: string): string; confirm(input: { intentId: string; amountMillimes: string; clientSecret: string }, ctx: RequestContext): Promise<unknown> }
export async function getPaymentProvider(): Promise<PaymentProvider> { const { stubPaymentProvider } = await import("./stub-payment-provider"); return stubPaymentProvider }
