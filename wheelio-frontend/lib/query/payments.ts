"use client"
import { useQuery } from "@tanstack/react-query"
import { fetchBookingPaymentTimeline, fetchPaymentHistory, fetchPaymentReceipt } from "@/lib/gateways/payments"
import { queryKeys } from "@/lib/query/keys"
export const usePaymentHistory = () => useQuery({ queryKey: queryKeys.account.payments(), queryFn: ({ signal }) => fetchPaymentHistory(signal), staleTime: 30_000 })
export const usePaymentReceipt = (id: string | null) => useQuery({ queryKey: queryKeys.account.payment(id ?? "none"), queryFn: ({ signal }) => fetchPaymentReceipt(id!, signal), enabled: Boolean(id), staleTime: 30_000 })
export const useBookingPaymentTimeline = (id: string) => useQuery({ queryKey: queryKeys.bookings.payments(id), queryFn: ({ signal }) => fetchBookingPaymentTimeline(id, signal), staleTime: 30_000 })
