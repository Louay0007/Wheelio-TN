"use client"

import { useLocale } from "@/lib/i18n/locale"
import { LOCALES, type AppLocale } from "@/lib/i18n/types"
import { cn } from "@/lib/utils"

const LABELS: Record<AppLocale, string> = {
  en: "EN",
  fr: "FR",
}

export function LanguageSwitcher({
  className,
  mutedClassName,
  activeClassName,
}: {
  className?: string
  mutedClassName?: string
  activeClassName?: string
}) {
  const { locale, setLocale, t } = useLocale()

  return (
    <div
      className={cn("flex items-center gap-3", className)}
      aria-label={t("footer.languages")}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "transition",
            locale === code
              ? activeClassName ?? "text-black dark:text-white"
              : mutedClassName ??
                  "hover:text-black dark:hover:text-white",
          )}
          aria-pressed={locale === code}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  )
}
