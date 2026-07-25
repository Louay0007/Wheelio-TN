"use client"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createDriver,
  confirmBookingClaim,
  requestBookingClaim,
  deleteDriver,
  deleteSavedOffer,
  deleteSavedSearch,
  fetchDriver,
  fetchDrivers,
  fetchMe,
  fetchNotificationPreferences,
  fetchNotifications,
  fetchPreferences,
  fetchPrivacyRequest,
  fetchPrivacyRequests,
  fetchPrivacyDownload,
  fetchProfile,
  fetchSavedOffers,
  fetchSavedSearches,
  fetchSessions,
  fetchSecurityOverview,
  requestPrivacyDeletion,
  requestPrivacyExport,
  revokeOtherSessions,
  revokeSession,
  updateDriver,
  updateNotificationPreferences,
  setNotificationRead,
  updatePreferences,
  updateProfile,
} from "@/lib/gateways/account"
import { queryKeys } from "@/lib/query/keys"
import { queryPolicies } from "@/lib/query/policies"
import type { CreateDriverInput } from "@/lib/contracts/account"

export function useMe() {
  return useQuery({
    queryKey: queryKeys.account.me(),
    queryFn: ({ signal }) => fetchMe(signal),
    ...queryPolicies.session,
    refetchOnWindowFocus: true,
  })
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.account.profile(),
    queryFn: ({ signal }) => fetchProfile(signal),
    staleTime: 60_000,
  })
}

export function usePreferences() {
  return useQuery({
    queryKey: queryKeys.account.preferences(),
    queryFn: ({ signal }) => fetchPreferences(signal),
    staleTime: 60_000,
  })
}

export function useDrivers() {
  return useQuery({
    queryKey: queryKeys.account.drivers(),
    queryFn: ({ signal }) => fetchDrivers(signal),
    staleTime: 60_000,
  })
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: queryKeys.account.driver(id),
    queryFn: ({ signal }) => fetchDriver(id, signal),
    staleTime: 60_000,
  })
}

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.account.sessions(),
    queryFn: ({ signal }) => fetchSessions(signal),
    staleTime: 30_000,
  })
}

export function useSecurityOverview() {
  return useQuery({
    queryKey: queryKeys.account.security(),
    queryFn: ({ signal }) => fetchSecurityOverview(signal),
    staleTime: 15_000,
  })
}

export function useNotifications(limit = 20) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.account.notifications(), { limit }],
    queryFn: ({ pageParam, signal }) => fetchNotifications(pageParam, limit, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.page.nextCursor ?? undefined,
    staleTime: 30_000,
  })
}

export function useNotificationReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => setNotificationRead(id, read),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.account.notifications() }),
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.account.notificationPreferences(),
    queryFn: ({ signal }) => fetchNotificationPreferences(signal),
    staleTime: 60_000,
  })
}

export function useSavedSearches() {
  return useQuery({
    queryKey: queryKeys.account.savedSearches(),
    queryFn: ({ signal }) => fetchSavedSearches(signal),
    staleTime: 60_000,
  })
}

export function useSavedOffers() {
  return useQuery({
    queryKey: queryKeys.account.savedOffers(),
    queryFn: ({ signal }) => fetchSavedOffers(signal),
    staleTime: 60_000,
  })
}

export function usePrivacyRequests() {
  return useQuery({ queryKey: queryKeys.account.privacyRequests(), queryFn: ({ signal }) => fetchPrivacyRequests(signal), refetchInterval: (query) => query.state.data?.some((item) => ["pending", "queued", "processing", "awaiting_retention"].includes(item.status)) ? 5_000 : false })
}

export function usePrivacyDownload() {
  return useMutation({ mutationFn: fetchPrivacyDownload })
}

export function usePrivacyRequest(id: string | null) {
  return useQuery({
    queryKey: queryKeys.account.privacyRequest(id ?? "none"),
    queryFn: ({ signal }) => fetchPrivacyRequest(id!, signal),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      ["pending", "queued", "processing", "awaiting_retention"].includes(query.state.data?.status ?? "") ? 5_000 : false,
  })
}

export function useAccountMutations() {
  const queryClient = useQueryClient()
  const invalidateAccount = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.account.all })

  return {
    updateProfile: useMutation({
      mutationFn: updateProfile,
      onSuccess: invalidateAccount,
    }),
    updatePreferences: useMutation({
      mutationFn: updatePreferences,
      onSuccess: invalidateAccount,
    }),
    createDriver: useMutation({
      mutationFn: ({
        input,
        idempotencyKey,
      }: {
        input: CreateDriverInput
        idempotencyKey: string
      }) => createDriver(input, idempotencyKey),
      onSuccess: invalidateAccount,
    }),
    updateDriver: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string
        input: Parameters<typeof updateDriver>[1]
      }) => updateDriver(id, input),
      onSuccess: invalidateAccount,
    }),
    deleteDriver: useMutation({
      mutationFn: ({ id, version }: { id: string; version: number }) =>
        deleteDriver(id, version),
      onSuccess: invalidateAccount,
    }),
    revokeSession: useMutation({
      mutationFn: revokeSession,
      onSuccess: invalidateAccount,
    }),
    revokeOtherSessions: useMutation({
      mutationFn: revokeOtherSessions,
      onSuccess: invalidateAccount,
    }),
    updateNotificationPreferences: useMutation({
      mutationFn: updateNotificationPreferences,
      onSuccess: invalidateAccount,
    }),
    deleteSavedSearch: useMutation({
      mutationFn: deleteSavedSearch,
      onSuccess: invalidateAccount,
    }),
    deleteSavedOffer: useMutation({
      mutationFn: deleteSavedOffer,
      onSuccess: invalidateAccount,
    }),
    requestPrivacyExport: useMutation({
      mutationFn: requestPrivacyExport,
      onSuccess: invalidateAccount,
    }),
    requestPrivacyDeletion: useMutation({
      mutationFn: ({
        input,
        idempotencyKey,
      }: {
        input: Parameters<typeof requestPrivacyDeletion>[0]
        idempotencyKey: string
      }) => requestPrivacyDeletion(input, idempotencyKey),
      onSuccess: invalidateAccount,
    }),
  }
}

export function useRequestBookingClaim() {
  return useMutation({ mutationFn: requestBookingClaim })
}
export function useConfirmBookingClaim() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ token, idempotencyKey }: { token: string; idempotencyKey: string }) => confirmBookingClaim(token, idempotencyKey), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.account.all }) })
}
