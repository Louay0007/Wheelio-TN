"use client"

import { useQuery } from "@tanstack/react-query"
import type { AppLocaleDto } from "@/lib/contracts/common"
import {
  fetchAgencies,
  fetchAgency,
  fetchBootstrap,
  fetchCategories,
  fetchCmsCollection,
  fetchCmsPage,
  fetchLocation,
  fetchLocations,
  fetchReviews,
} from "@/lib/gateways/catalog"
import { queryKeys } from "@/lib/query/keys"
import { queryPolicies } from "@/lib/query/policies"
import type {
  CmsContent,
  PublicAgency,
  PublicBootstrap,
  PublicLocation,
  PublicReview,
} from "@/lib/contracts/public-catalog"

export function usePublicBootstrap(
  locale: AppLocaleDto,
  initialData?: PublicBootstrap,
) {
  return useQuery({
    queryKey: queryKeys.public.bootstrap(locale),
    queryFn: ({ signal }) => fetchBootstrap(locale, signal),
    initialData,
    ...queryPolicies.staticCatalog,
  })
}

export function usePublicLocations(
  locale: AppLocaleDto,
  initialData?: PublicLocation[],
) {
  return useQuery({
    queryKey: queryKeys.public.locations(locale),
    queryFn: ({ signal }) => fetchLocations(locale, signal),
    initialData,
    ...queryPolicies.staticCatalog,
  })
}

export function usePublicLocation(slug: string, locale: AppLocaleDto) {
  return useQuery({
    queryKey: queryKeys.public.location(slug, locale),
    queryFn: ({ signal }) => fetchLocation(slug, locale, signal),
    ...queryPolicies.staticCatalog,
  })
}

export function usePublicCategories(locale: AppLocaleDto) {
  return useQuery({
    queryKey: queryKeys.public.categories(locale),
    queryFn: ({ signal }) => fetchCategories(locale, signal),
    ...queryPolicies.staticCatalog,
  })
}

export function usePublicAgencies(
  locale: AppLocaleDto,
  filters?: { city?: string; minRating?: number },
  initialData?: PublicAgency[],
) {
  return useQuery({
    queryKey: queryKeys.public.agencies(locale, filters),
    queryFn: ({ signal }) => fetchAgencies(locale, filters, signal),
    initialData,
    ...queryPolicies.publicDirectory,
  })
}

export function usePublicAgency(slug: string, locale: AppLocaleDto) {
  return useQuery({
    queryKey: queryKeys.public.agency(slug, locale),
    queryFn: ({ signal }) => fetchAgency(slug, locale, signal),
    ...queryPolicies.publicDirectory,
  })
}

export function usePublicReviews(
  locale: AppLocaleDto,
  filters?: { agencyId?: string; locationId?: string; minRating?: number },
  initialData?: PublicReview[],
) {
  return useQuery({
    queryKey: queryKeys.public.reviews(locale, filters),
    queryFn: ({ signal }) => fetchReviews(locale, filters, signal),
    initialData,
    ...queryPolicies.publicDirectory,
  })
}

export function useCmsPage(
  kind: string,
  slug: string,
  locale: AppLocaleDto,
  initialData?: CmsContent,
) {
  return useQuery({
    queryKey: queryKeys.public.cms(kind, slug, locale),
    queryFn: ({ signal }) => fetchCmsPage(kind, slug, locale, signal),
    initialData,
    ...queryPolicies.staticCatalog,
  })
}

export function useCmsCollection(
  kind: string,
  locale: AppLocaleDto,
  initialData?: CmsContent[],
) {
  return useQuery({
    queryKey: queryKeys.public.cmsCollection(kind, locale),
    queryFn: ({ signal }) => fetchCmsCollection(kind, locale, signal),
    initialData,
    ...queryPolicies.staticCatalog,
  })
}
