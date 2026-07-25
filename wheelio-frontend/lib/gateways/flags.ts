/**
 * Vertical-slice feature flags for API cutover.
 * Auth/account/catalog reads use the API by default in this Stage 1 build.
 * Checkout is Stage 2 — enable with NEXT_PUBLIC_API_SLICE_CHECKOUT=1.
 * Agency/admin slices flip as Stage 3–5 routes become authoritative.
 */
export function useApiAuthSlice() {
  if (typeof process === "undefined") return true
  return process.env.NEXT_PUBLIC_API_SLICE_AUTH !== "0"
}

export function useApiCatalogSlice() {
  if (typeof process === "undefined") return true
  return process.env.NEXT_PUBLIC_API_SLICE_CATALOG !== "0"
}

export function useApiCheckoutSlice() {
  if (typeof process === "undefined") return true
  return process.env.NEXT_PUBLIC_API_SLICE_CHECKOUT !== "0"
}

export function useApiAgencySlice() {
  if (typeof process === "undefined") return false
  return process.env.NEXT_PUBLIC_API_SLICE_AGENCY === "1"
}

export function useApiAdminSlice() {
  if (typeof process === "undefined") return false
  return process.env.NEXT_PUBLIC_API_SLICE_ADMIN === "1"
}

/**
 * Stage 6 cutover: when true, demo localStorage must not be treated as domain truth.
 * Locale/theme device hints may remain.
 *
 * Base gate = auth + catalog + checkout. When AGENCY/ADMIN slices are also on,
 * those workspaces must not be domain truth either (enforced in session libs).
 */
export function rejectLocalDomainTruth() {
  return (
    useApiAuthSlice() &&
    useApiCatalogSlice() &&
    useApiCheckoutSlice()
  )
}

/** True when agency portal must use API gateways only. */
export function rejectAgencyLocalDomainTruth() {
  return rejectLocalDomainTruth() && useApiAgencySlice()
}

/** True when admin portal must use API gateways only. */
export function rejectAdminLocalDomainTruth() {
  return rejectLocalDomainTruth() && useApiAdminSlice()
}
