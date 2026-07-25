"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import {
  createBookingFromQuote,
  createHold,
  createPaymentIntent,
  createQuote,
  createSearch,
  fetchBooking,
  fetchCheckoutContext,
} from "@/lib/gateways/checkout"
import type { SearchInput } from "@/lib/contracts/checkout"

export function useCanonicalSearch(input: SearchInput) {
  return useQuery({
    queryKey: ["search", input],
    queryFn: ({ signal }) => createSearch(input, signal),
    staleTime: 0,
    retry: 1,
  })
}

export function useCreateQuote() {
  return useMutation({ mutationFn: createQuote })
}

export function useCreateHold() {
  return useMutation({
    mutationFn: (command: {
      quoteId: string
      version: number
      idempotencyKey: string
    }) =>
      createHold(
        command.quoteId,
        { expectedQuoteVersion: command.version },
        command.idempotencyKey,
      ),
  })
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (command: {
      input: Parameters<typeof createBookingFromQuote>[0]
      idempotencyKey: string
    }) => createBookingFromQuote(command.input, command.idempotencyKey),
  })
}

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (command: { bookingId: string; idempotencyKey: string }) =>
      createPaymentIntent(command.bookingId, {
        purpose: "rental",
        idempotencyKey: command.idempotencyKey,
      }),
  })
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ["bookings", bookingId],
    queryFn: () => fetchBooking(bookingId),
    enabled: Boolean(bookingId),
  })
}

export function useCheckoutContext(quoteId: string) {
  return useQuery({
    queryKey: ["checkout", quoteId],
    queryFn: ({ signal }) => fetchCheckoutContext(quoteId, signal),
    enabled: Boolean(quoteId),
    staleTime: 15_000,
  })
}
