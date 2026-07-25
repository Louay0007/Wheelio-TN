import { apiFetch, apiFetchCollection } from "@/lib/api/client"
import { bookingPaymentTimelineSchema, paymentReceiptSchema, paymentRecordSchema } from "@/lib/contracts/payments"
export const fetchPaymentHistory = (signal?: AbortSignal) => apiFetchCollection("/api/v1/account/payments", { itemSchema: paymentRecordSchema, signal })
export const fetchPaymentReceipt = (id: string, signal?: AbortSignal) => apiFetch(`/api/v1/account/payments/${id}`, { schema: paymentReceiptSchema, signal })
export const fetchBookingPaymentTimeline = (bookingId: string, signal?: AbortSignal) => apiFetch(`/api/v1/bookings/${bookingId}/payments`, { schema: bookingPaymentTimelineSchema, signal })
