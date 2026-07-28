"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  cancelBooking,
  createCancellationQuote,
  fetchBookingDetail,
  fetchBookings,
  updateBookingSchedule,
} from "@/lib/gateways/bookings"

export const bookingQueryKeys = {
  all: ["bookings"] as const,
  detail: (bookingId: string) => ["bookings", bookingId] as const,
}

function useRefreshBooking() {
  const queryClient = useQueryClient()
  return (bookingId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.detail(bookingId) }),
    ])
}

export function useBookings() {
  return useQuery({
    queryKey: bookingQueryKeys.all,
    queryFn: fetchBookings,
  })
}

export function useBookingDetail(bookingId: string) {
  return useQuery({
    queryKey: bookingQueryKeys.detail(bookingId),
    queryFn: () => fetchBookingDetail(bookingId),
    enabled: Boolean(bookingId),
  })
}

export function useCancellationQuote() {
  return useMutation({
    mutationFn: createCancellationQuote,
  })
}

export function useCancelBooking() {
  const refresh = useRefreshBooking()
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: async (result) => refresh(result.bookingId),
  })
}

export function useUpdateBookingSchedule() {
  const refresh = useRefreshBooking()
  return useMutation({
    mutationFn: updateBookingSchedule,
    onSuccess: async (result) => refresh(result.bookingId),
  })
}
