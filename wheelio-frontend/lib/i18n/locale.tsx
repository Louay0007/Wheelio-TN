"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { translateUiPhrase } from "@/lib/i18n/fr-ui"
import { translate, type MessageKey } from "@/lib/i18n/messages"
import {
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type AppLocale,
} from "@/lib/i18n/types"

type LocaleContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
  /** Translate an English UI phrase when locale is FR (exact match in FR_UI). */
  tx: (english: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en")

  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("locale")
      if (fromUrl === "en" || fromUrl === "fr") {
        setLocaleState(fromUrl)
        localStorage.setItem(LOCALE_STORAGE_KEY, fromUrl)
        document.cookie = `${LOCALE_STORAGE_KEY}=${fromUrl}; Path=/; Max-Age=31536000; SameSite=Lax`
        return
      }
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
      const normalized = normalizeLocale(stored)
      setLocaleState(normalized)
      document.cookie = `${LOCALE_STORAGE_KEY}=${normalized}; Path=/; Max-Age=31536000; SameSite=Lax`
    } catch {
      /* ignore */
    }
  }, [])

  const setLocale = useCallback((next: AppLocale) => {
    const locale = normalizeLocale(next)
    setLocaleState(locale)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
      document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
      document.documentElement.lang = locale
      window.dispatchEvent(new Event("wheelio-locale"))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = "ltr"
  }, [locale])

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  )

  const tx = useCallback(
    (english: string) => translateUiPhrase(english, locale),
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, tx }),
    [locale, setLocale, t, tx],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    return {
      locale: "en" as AppLocale,
      setLocale: (_: AppLocale) => {},
      t: (key: MessageKey, vars?: Record<string, string | number>) =>
        translate("en", key, vars),
      tx: (english: string) => english,
    }
  }
  return ctx
}
