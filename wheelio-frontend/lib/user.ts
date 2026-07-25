/** Legacy view-model types retained while remaining consumers move to API DTOs. */

export type DemoLanguage = "en" | "fr"
export type DemoThemePref = "system" | "light" | "dark"
export type DemoAgeBand = "21-24" | "25-29" | "30"

export type DemoDriver = {
  id: string
  fullName: string
  ageBand: DemoAgeBand
  licenseCountry: string
  licenseNumber: string
  licenseExpiry: string
  licenseCategory: string
  primary: boolean
  notes?: string
  dateOfBirth?: string
}

export type NotificationChannelPref = { email: boolean; sms: boolean }

export type DemoUser = {
  id: string
  name: string
  preferredName?: string
  email: string
  phone?: string
  dateOfBirth?: string
  nationality?: string
  residenceCountry?: string
  addressLine?: string
  city?: string
  language: DemoLanguage
  theme: DemoThemePref
  createdAt: string
  emailVerified: boolean
  marketingOptIn: boolean
  usualPickup?: string
  defaultAgeBand?: DemoAgeBand
  extrasInterests?: string[]
  drivers: DemoDriver[]
  notificationPrefs: Record<string, NotificationChannelPref>
  claimedBookingIds: string[]
  welcomeCompleted?: boolean
}

export function userInitials(user: Pick<DemoUser, "name" | "preferredName">): string {
  const source = user.preferredName || user.name
  const parts = source.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "W"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}

export function maskLicense(number: string): string {
  if (number.includes("•")) return number
  if (number.length <= 4) return "••••"
  return `${number.slice(0, 2)}-••••-${number.slice(-4)}`
}
