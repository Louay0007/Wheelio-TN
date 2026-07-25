import { z } from "zod"
import {
  accountPreferencesSchema,
  bookingClaimRequestAckSchema,
  bookingClaimResultSchema,
  customerProfileSchema,
  customerNotificationSchema,
  notificationReadAckSchema,
  driverSchema,
  meSchema,
  mutationAckSchema,
  notificationPreferencesSchema,
  privacyRequestSchema,
  savedOfferSchema,
  savedSearchSchema,
  sessionSchema,
  securityOverviewSchema,
  type CreateDriverInput,
  type NotificationPreferences,
  type UpdateCustomerProfileInput,
  type UpdateDriverInput,
} from "@/lib/contracts/account"
import {
  apiFetch,
  apiFetchCollection,
  apiFetchPage,
} from "@/lib/api/client"

export function fetchMe(signal?: AbortSignal) {
  return apiFetch("/api/v1/me", { schema: meSchema, signal })
}

export function fetchProfile(signal?: AbortSignal) {
  return apiFetch("/api/v1/account/profile", {
    schema: customerProfileSchema,
    signal,
  })
}

export function updateProfile(input: UpdateCustomerProfileInput) {
  return apiFetch("/api/v1/account/profile", {
    method: "PATCH",
    json: input,
    schema: customerProfileSchema,
  })
}

export function fetchPreferences(signal?: AbortSignal) {
  return apiFetch("/api/v1/account/preferences", {
    schema: accountPreferencesSchema,
    signal,
  })
}

export function updatePreferences(
  input: {
    version: number
    preferredLocale?: "en" | "fr"
    theme?: "system" | "light" | "dark"
    usualPickup?: string | null
    defaultAgeBand?: string | null
    extrasInterests?: string[]
    marketingOptIn?: boolean
  },
) {
  return apiFetch("/api/v1/account/preferences", {
    method: "PATCH",
    json: input,
    schema: accountPreferencesSchema,
  })
}

export function fetchDrivers(signal?: AbortSignal) {
  return apiFetchCollection("/api/v1/account/drivers", {
    itemSchema: driverSchema,
    signal,
  })
}

export function fetchDriver(id: string, signal?: AbortSignal) {
  return apiFetch(`/api/v1/account/drivers/${id}`, {
    schema: driverSchema,
    signal,
  })
}

export function createDriver(input: CreateDriverInput, idempotencyKey: string) {
  return apiFetch("/api/v1/account/drivers", {
    method: "POST",
    json: input,
    schema: driverSchema,
    idempotencyKey,
  })
}

export function updateDriver(id: string, input: UpdateDriverInput) {
  return apiFetch(`/api/v1/account/drivers/${id}`, {
    method: "PATCH",
    json: input,
    schema: driverSchema,
  })
}

export function deleteDriver(id: string, version: number) {
  return apiFetch<void>(
    `/api/v1/account/drivers/${id}?version=${encodeURIComponent(version)}`,
    { method: "DELETE" },
  )
}

export function fetchSessions(signal?: AbortSignal) {
  return apiFetchCollection("/api/v1/me/sessions", {
    itemSchema: sessionSchema,
    signal,
  })
}

export function fetchSecurityOverview(signal?: AbortSignal) {
  return apiFetch("/api/v1/me/security", {
    schema: securityOverviewSchema,
    signal,
  })
}

export function revokeSession(id: string) {
  return apiFetch(`/api/v1/me/sessions/${id}`, {
    method: "DELETE",
    schema: mutationAckSchema,
  })
}

export function revokeOtherSessions() {
  return apiFetch("/api/v1/me/sessions/revoke-others", {
    method: "POST",
    schema: mutationAckSchema,
  })
}

export function fetchNotifications(after?: string, limit = 20, signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (after) params.set("after", after)
  return apiFetchPage(`/api/v1/account/notifications?${params}`, customerNotificationSchema, { signal })
}

export function setNotificationRead(id: string, read: boolean) {
  return apiFetch(`/api/v1/account/notifications/${id}`, {
    method: "PATCH", json: { read }, schema: notificationReadAckSchema,
  })
}

export function fetchNotificationPreferences(signal?: AbortSignal) {
  return apiFetch("/api/v1/account/notification-preferences", {
    schema: notificationPreferencesSchema,
    signal,
  })
}

export function updateNotificationPreferences(
  input: Pick<NotificationPreferences, "preferences">,
) {
  return apiFetch("/api/v1/account/notification-preferences", {
    method: "PUT",
    json: input,
    schema: notificationPreferencesSchema,
  })
}

export function fetchSavedSearches(signal?: AbortSignal) {
  return apiFetchCollection("/api/v1/account/saved-searches", {
    itemSchema: savedSearchSchema,
    signal,
  })
}

export function fetchSavedOffers(signal?: AbortSignal) {
  return apiFetchCollection("/api/v1/account/saved-offers", {
    itemSchema: savedOfferSchema,
    signal,
  })
}

export function deleteSavedSearch(id: string) {
  return apiFetch(`/api/v1/account/saved-searches/${id}`, {
    method: "DELETE",
    schema: mutationAckSchema,
  })
}

export function deleteSavedOffer(id: string) {
  return apiFetch(`/api/v1/account/saved-offers/${id}`, {
    method: "DELETE",
    schema: mutationAckSchema,
  })
}

export function requestPrivacyExport(idempotencyKey: string) {
  return apiFetch("/api/v1/account/privacy/exports", {
    method: "POST",
    schema: privacyRequestSchema,
    idempotencyKey,
  })
}

export function requestPrivacyDeletion(
  input: { reason: string; confirm: true },
  idempotencyKey: string,
) {
  return apiFetch("/api/v1/account/privacy/deletion", {
    method: "POST",
    json: input,
    schema: privacyRequestSchema,
    idempotencyKey,
  })
}


export function fetchPrivacyRequests(signal?: AbortSignal) {
  return apiFetch("/api/v1/account/privacy/requests", {
    schema: privacyRequestSchema.array(), signal,
  })
}

export function fetchPrivacyDownload(id: string) {
  return apiFetch(`/api/v1/account/privacy/requests/${id}/download`, {
    method: "POST", schema: z.object({ url: z.string().url(), expiresAt: z.string() }),
  })
}

export function fetchPrivacyRequest(id: string, signal?: AbortSignal) {
  return apiFetch(`/api/v1/account/privacy/requests/${id}`, {
    schema: privacyRequestSchema,
    signal,
  })
}

export function requestBookingClaim(input: { reference: string; email: string }) {
  return apiFetch("/api/v1/public/booking-claims/request", {
    method: "POST", json: input, schema: bookingClaimRequestAckSchema,
  })
}
export function confirmBookingClaim(token: string, idempotencyKey: string) {
  return apiFetch("/api/v1/account/booking-claims/confirm", {
    method: "POST", json: { token }, schema: bookingClaimResultSchema, idempotencyKey,
  })
}
