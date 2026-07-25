/**
 * Wheelio TN locale — EN / FR only (no AR).
 */

export type AppLocale = "en" | "fr"

export const LOCALE_STORAGE_KEY = "wheelio-locale"
export const LOCALES: AppLocale[] = ["en", "fr"]

export function isAppLocale(v: unknown): v is AppLocale {
  return v === "en" || v === "fr"
}

export function normalizeLocale(v: unknown): AppLocale {
  if (v === "ar") return "en"
  return isAppLocale(v) ? v : "en"
}
