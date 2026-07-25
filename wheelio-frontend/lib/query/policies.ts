export const queryPolicies = {
  staticCatalog: {
    staleTime: 15 * 60_000,
    gcTime: 60 * 60_000,
  },
  publicDirectory: {
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  },
  session: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  },
  liveOperations: {
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  },
} as const
