import { apiFetch, apiFetchCollection } from "@/lib/api/client"

export type ApiProfile = {
  id: string
  userId: string
  legalName: string
  preferredName: string | null
  phone: string | null
  dateOfBirth: string | null
  nationality: string | null
  residenceCountry: string | null
  addressLine: string | null
  city: string | null
  preferredLocale: "en" | "fr"
  theme: "system" | "light" | "dark"
  usualPickup: string | null
  defaultAgeBand: string | null
  marketingOptIn: boolean
  welcomeCompleted: boolean
  extrasInterests: string[]
  version: number
  updatedAt: string
}

export type ApiDriver = {
  id: string
  fullName: string
  ageBand: string
  dateOfBirth: string | null
  licenseCountry: string
  licenseNumberMasked: string
  licenseExpiry: string
  licenseCategory: string
  isPrimary: boolean
  notes: string | null
  version: number
  updatedAt: string
}

export type ApiMe = {
  user: {
    id: string
    email: string
    emailVerified: boolean
    name: string
  }
  profile: ApiProfile
  customerProfileId: string
}

export async function fetchMe() {
  return apiFetch<ApiMe>("/api/v1/me")
}

export async function fetchProfile() {
  return apiFetch<ApiProfile>("/api/v1/account/profile")
}

export async function patchProfile(
  input: Partial<ApiProfile> & { version: number },
) {
  return apiFetch<ApiProfile>("/api/v1/account/profile", {
    method: "PATCH",
    json: input,
  })
}

export async function fetchDrivers() {
  return apiFetchCollection<ApiDriver>("/api/v1/account/drivers")
}

export async function createDriver(input: {
  fullName: string
  ageBand: "21-24" | "25-29" | "30"
  licenseCountry: string
  licenseNumber: string
  licenseExpiry: string
  licenseCategory?: string
  isPrimary?: boolean
  notes?: string | null
  dateOfBirth?: string | null
}) {
  return apiFetch<ApiDriver>("/api/v1/account/drivers", {
    method: "POST",
    json: input,
  })
}

export async function patchDriver(
  driverId: string,
  input: Record<string, unknown> & { version: number },
) {
  return apiFetch<ApiDriver>(`/api/v1/account/drivers/${driverId}`, {
    method: "PATCH",
    json: input,
  })
}

export async function deleteDriver(driverId: string, version: number) {
  return apiFetch<void>(
    `/api/v1/account/drivers/${driverId}?version=${version}`,
    { method: "DELETE" },
  )
}

export async function fetchPreferences() {
  return apiFetch<{
    preferredLocale: "en" | "fr"
    theme: "system" | "light" | "dark"
    usualPickup: string | null
    defaultAgeBand: string | null
    extrasInterests: string[]
    marketingOptIn: boolean
    version: number
  }>("/api/v1/account/preferences")
}

export async function patchPreferences(input: Record<string, unknown> & { version: number }) {
  return apiFetch("/api/v1/account/preferences", {
    method: "PATCH",
    json: input,
  })
}
