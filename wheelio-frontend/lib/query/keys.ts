import type { AppLocaleDto } from "@/lib/contracts/common"

export const queryKeys = {
  public: {
    all: ["public"] as const,
    bootstrap: (locale: AppLocaleDto) =>
      ["public", "bootstrap", { locale }] as const,
    locations: (locale: AppLocaleDto) =>
      ["public", "locations", { locale }] as const,
    location: (slug: string, locale: AppLocaleDto) =>
      ["public", "locations", "detail", slug, { locale }] as const,
    categories: (locale: AppLocaleDto) =>
      ["public", "categories", { locale }] as const,
    agencies: (
      locale: AppLocaleDto,
      filters?: { city?: string; minRating?: number },
    ) => ["public", "agencies", { locale, ...filters }] as const,
    agency: (slug: string, locale: AppLocaleDto) =>
      ["public", "agencies", "detail", slug, { locale }] as const,
    reviews: (
      locale: AppLocaleDto,
      filters?: { agencyId?: string; locationId?: string; minRating?: number },
    ) => ["public", "reviews", { locale, ...filters }] as const,
    cms: (kind: string, slug: string, locale: AppLocaleDto) =>
      ["public", "cms", kind, slug, { locale }] as const,
    cmsCollection: (kind: string, locale: AppLocaleDto) =>
      ["public", "cms", kind, "collection", { locale }] as const,
  },
  account: {
    all: ["account"] as const,
    me: () => ["account", "me"] as const,
    profile: () => ["account", "profile"] as const,
    drivers: () => ["account", "drivers"] as const,
    driver: (id: string) => ["account", "drivers", id] as const,
    preferences: () => ["account", "preferences"] as const,
    notifications: () => ["account", "notifications"] as const,
    notificationPreferences: () =>
      ["account", "notification-preferences"] as const,
    sessions: () => ["account", "sessions"] as const,
    security: () => ["account", "security"] as const,
    savedSearches: () => ["account", "saved-searches"] as const,
    savedOffers: () => ["account", "saved-offers"] as const,
    payments: () => ["account", "payments"] as const,
    payment: (id: string) => ["account", "payments", id] as const,
    privacyRequests: () => ["account", "privacy-requests"] as const,
    privacyRequest: (id: string) =>
      ["account", "privacy-requests", id] as const,
  },
  bookings: { payments: (id: string) => ["bookings", id, "payments"] as const },
  agency: {
    all: ["agency"] as const,
    tenant: (agencyId: string) => ["agency", agencyId] as const,
  },
  admin: {
    all: ["admin"] as const,
  },
} as const
