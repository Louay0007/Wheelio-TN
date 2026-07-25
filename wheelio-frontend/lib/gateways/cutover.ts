/**
 * Stage 6 cutover helpers — stop treating browser storage as domain truth.
 *
 * Allowed device hints: locale, theme.
 * Forbidden domain keys when API slices are on: workspace/session/user/
 * application/contract booking mirrors.
 */

import {
  rejectAdminLocalDomainTruth,
  rejectAgencyLocalDomainTruth,
  rejectLocalDomainTruth,
  useApiAdminSlice,
  useApiAgencySlice,
} from "@/lib/gateways/flags"

export const DOMAIN_STORAGE_KEYS = [
  "wheelio-demo-session",
  "wheelio-demo-user",
  "wheelio-bookings",
  "wheelio-agency-workspace",
  "wheelio-agency-session",
  "wheelio-agency-branch",
  "wheelio-admin-workspace",
  "wheelio-admin-session",
  "wheelio-partner-application",
  "wheelio-contract-artifacts",
] as const

const CUSTOMER_KEYS = new Set([
  "wheelio-demo-session",
  "wheelio-demo-user",
  "wheelio-bookings",
  "wheelio-partner-application",
  "wheelio-contract-artifacts",
])

const AGENCY_KEYS = new Set([
  "wheelio-agency-workspace",
  "wheelio-agency-session",
  "wheelio-agency-branch",
])

const ADMIN_KEYS = new Set([
  "wheelio-admin-workspace",
  "wheelio-admin-session",
])

export function assertNotDomainStorage(key: string) {
  const blocked =
    (CUSTOMER_KEYS.has(key) && rejectLocalDomainTruth()) ||
    (AGENCY_KEYS.has(key) &&
      (rejectAgencyLocalDomainTruth() || useApiAgencySlice())) ||
    (ADMIN_KEYS.has(key) &&
      (rejectAdminLocalDomainTruth() || useApiAdminSlice()))

  if (!blocked) return
  throw new Error(
    `Stage 6 cutover: refusing localStorage domain key "${key}". Use API gateways.`,
  )
}

export function readDeviceHint(key: "wheelio-locale" | "wheelio-theme") {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(key)
}

export function writeDeviceHint(
  key: "wheelio-locale" | "wheelio-theme",
  value: string,
) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, value)
}

/** Surfaces with real API+UI dual-path wiring under agency/admin slices. */
export const WIRED_AGENCY_SURFACES = [
  "dashboard",
  "bookings",
  "inbox",
  "fleet",
  "fleet.detail",
  "fleet.photos",
  "fleet.availability",
  "rates",
  "rates.detail",
  "rates.fees",
  "branches",
  "onboarding",
  "policies",
  "notifications",
  "notifications.settings",
  "bookings.messages",
  "team",
  "settings",
  "calendar",
  "reviews",
  "reports",
  "finance",
  "bookings.prepare",
  "bookings.issues",
  "bookings.documents",
  "bookings.finance",
  "branches.detail",
  "branches.hours",
  "branches.delivery",
  "invite.accept",
  "payouts",
  "payouts.detail",
  "invoices",
  "ledger",
  "fleet.categories",
  "rates.preview",
  "reports.quality",
  "documents",
] as const

export const WIRED_ADMIN_SURFACES = [
  "bookings",
  "bookings.detail",
  "bookings.money",
  "bookings.timeline",
  "bookings.messages",
  "customers",
  "customers.detail",
  "cases",
  "cases.detail",
  "finance.ledger",
  "finance.payouts",
  "finance.refunds",
  "finance.invoices",
  "finance.reconciliation",
  "finance.commissions",
  "applications",
  "agencies",
  "agencies.detail",
  "claims",
  "claims.detail",
  "feature-flags",
  "promotions",
  "locations",
  "staff",
  "staff.detail",
  "audit",
  "analytics",
  "analytics.demand",
  "analytics.supply",
  "analytics.finance",
  "analytics.quality",
  "agencies.branches",
  "agencies.fleet",
  "agencies.staff",
  "agencies.rates",
  "agencies.payouts",
  "agencies.documents",
  "agencies.contract",
  "agencies.quality",
  "bookings.override",
  "customers.bookings",
  "customers.risk",
  "categories",
  "vehicles",
  "vehicles.detail",
  "fees-catalog",
  "sla",
  "settings",
  "settings.security",
  "notifications",
  "promotions.detail",
  "finance.refunds.detail",
  "locations.detail",
  "content.reviews",
] as const

/**
 * No Priority-A empty shells remain. Keep empty for Stage 6 inventory tests;
 * lower-priority agency/admin chrome may still use demo until their modules land.
 */
export const UNWIRED_EMPTY_STATE_SURFACES = [] as const
