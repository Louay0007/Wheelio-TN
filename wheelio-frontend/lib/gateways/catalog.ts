import { apiFetch, apiFetchCollection } from "@/lib/api/client"
import {
  cmsContentSchema,
  publicAgencyDetailSchema,
  publicAgencySchema,
  publicBootstrapSchema,
  publicCategorySchema,
  publicLocationSchema,
  publicReviewSchema,
  type CmsContent,
  type PublicAgency,
  type PublicAgencyDetail,
  type PublicBootstrap,
  type PublicCategory,
  type PublicLocation,
  type PublicReview,
} from "@/lib/contracts/public-catalog"
import type { AppLocaleDto } from "@/lib/contracts/common"

export async function fetchBootstrap(
  locale: AppLocaleDto = "en",
  signal?: AbortSignal,
) {
  return apiFetch<PublicBootstrap>(`/api/v1/public/bootstrap?locale=${locale}`, {
    schema: publicBootstrapSchema,
    signal,
  })
}

export async function fetchLocations(
  locale: AppLocaleDto = "en",
  signal?: AbortSignal,
) {
  return apiFetchCollection<PublicLocation>(
    `/api/v1/public/locations?locale=${locale}`,
    { itemSchema: publicLocationSchema, signal },
  )
}

export async function fetchLocation(
  slug: string,
  locale: AppLocaleDto = "en",
  signal?: AbortSignal,
) {
  return apiFetch<PublicLocation>(
    `/api/v1/public/locations/${slug}?locale=${locale}`,
    { schema: publicLocationSchema, signal },
  )
}

export async function fetchCategories(
  locale: AppLocaleDto = "en",
  signal?: AbortSignal,
) {
  return apiFetchCollection<PublicCategory>(
    `/api/v1/public/categories?locale=${locale}`,
    { itemSchema: publicCategorySchema, signal },
  )
}

export async function fetchAgencies(
  locale: AppLocaleDto = "en",
  filters?: { city?: string; minRating?: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ locale })
  if (filters?.city) params.set("city", filters.city)
  if (filters?.minRating != null) {
    params.set("minRating", String(filters.minRating))
  }
  return apiFetchCollection<PublicAgency>(
    `/api/v1/public/agencies?${params.toString()}`,
    { itemSchema: publicAgencySchema, signal },
  )
}

export async function fetchAgency(
  slug: string,
  locale: AppLocaleDto = "en",
  signal?: AbortSignal,
) {
  return apiFetch<PublicAgencyDetail>(
    `/api/v1/public/agencies/${slug}?locale=${locale}`,
    { schema: publicAgencyDetailSchema, signal },
  )
}

export async function fetchCmsPage(
  kind: string,
  slug: string,
  locale: AppLocaleDto = "en",
  signal?: AbortSignal,
) {
  return apiFetch<CmsContent>(
    `/api/v1/public/cms/${kind}/${slug}?locale=${locale}`,
    { schema: cmsContentSchema, signal },
  )
}

export async function fetchCmsCollection(
  kind: string,
  locale: AppLocaleDto = "en",
  signal?: AbortSignal,
) {
  return apiFetchCollection<CmsContent>(
    `/api/v1/public/cms/${kind}?locale=${locale}`,
    { itemSchema: cmsContentSchema, signal },
  )
}

export async function fetchReviews(
  locale: AppLocaleDto = "en",
  filters?: { agencyId?: string; locationId?: string; minRating?: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ locale })
  if (filters?.agencyId) params.set("agencyId", filters.agencyId)
  if (filters?.locationId) params.set("locationId", filters.locationId)
  if (filters?.minRating != null) {
    params.set("minRating", String(filters.minRating))
  }
  return apiFetchCollection<PublicReview>(
    `/api/v1/public/reviews?${params.toString()}`,
    { itemSchema: publicReviewSchema, signal },
  )
}
