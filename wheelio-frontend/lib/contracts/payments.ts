import { z } from "zod"
import { isoDateTimeSchema, millimesSchema } from "@/lib/contracts/common"
export const paymentRecordSchema = z.object({ id: z.string().min(1), bookingId: z.string().min(1), bookingReference: z.string().min(1), intentId: z.string().min(1), provider: z.string().min(1), type: z.string().min(1), status: z.string().min(1), amountMillimes: millimesSchema, currency: z.literal("TND"), createdAt: isoDateTimeSchema, receiptAvailable: z.boolean(), receiptPath: z.string().nullable() })
export const paymentReceiptSchema = paymentRecordSchema.extend({ providerTransactionId: z.string().nullable(), purpose: z.string().min(1), downloadPath: z.string().nullable() })
export const bookingPaymentTimelineSchema = z.object({ bookingId: z.string().min(1), bookingReference: z.string().min(1), paymentMode: z.string().min(1), currency: z.literal("TND"), totalMillimes: millimesSchema, events: z.array(paymentReceiptSchema) })
export type PaymentRecord = z.infer<typeof paymentRecordSchema>
export type PaymentReceipt = z.infer<typeof paymentReceiptSchema>
export type BookingPaymentTimeline = z.infer<typeof bookingPaymentTimelineSchema>
