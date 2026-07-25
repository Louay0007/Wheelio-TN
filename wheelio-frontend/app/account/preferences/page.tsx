"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { AccountShell } from "@/components/account/account-shell"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import { fieldInputClass } from "@/components/account/password-fields"
import { BookingInlineToast } from "@/components/bookings/booking-inline-toast"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ApiClientError } from "@/lib/api/client"
import type {
  AppLocaleDto,
} from "@/lib/contracts/common"
import type {
  ageBandSchema,
  themePreferenceSchema,
} from "@/lib/contracts/account"
import type { z } from "zod"
import { useLocale } from "@/lib/i18n/locale"
import { useAccountMutations, usePreferences } from "@/lib/query/account"

type AgeBand = z.infer<typeof ageBandSchema>
type ThemePreference = z.infer<typeof themePreferenceSchema>

const USUAL_PICKUP_OPTIONS = [
  "Tunis-Carthage Airport (TUN)",
  "Tunis centre",
  "Hammamet",
  "Sousse",
  "Monastir",
  "Djerba",
  "Other",
] as const

const EXTRA_OPTIONS = [
  { id: "child_seat", label: "Child seat" },
  { id: "additional_driver", label: "Additional driver" },
  { id: "gps", label: "GPS / navigation" },
] as const

export default function PreferencesPage() {
  const preferences = usePreferences()
  const mutations = useAccountMutations()
  const { setTheme } = useTheme()
  const { setLocale } = useLocale()
  const [toast, setToast] = useState<string | null>(null)
  const [language, setLanguage] = useState<AppLocaleDto>("en")
  const [themePref, setThemePref] = useState<ThemePreference>("system")
  const [ageBand, setAgeBand] = useState<AgeBand>("30")
  const [usualPickup, setUsualPickup] = useState("")
  const [extras, setExtras] = useState<string[]>([])

  useEffect(() => {
    if (!preferences.data) return
    setLanguage(preferences.data.preferredLocale)
    setThemePref(preferences.data.theme)
    setAgeBand(
      preferences.data.defaultAgeBand === "21-24" ||
        preferences.data.defaultAgeBand === "25-29"
        ? preferences.data.defaultAgeBand
        : "30",
    )
    setUsualPickup(preferences.data.usualPickup ?? USUAL_PICKUP_OPTIONS[0])
    setExtras(preferences.data.extrasInterests)
  }, [preferences.data])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  function toggleExtra(id: string) {
    setExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!preferences.data) return
    try {
      await mutations.updatePreferences.mutateAsync({
        preferredLocale: language,
        theme: themePref,
      defaultAgeBand: ageBand,
      usualPickup: usualPickup || undefined,
      extrasInterests: extras.length ? extras : undefined,
        version: preferences.data.version,
      })
      setTheme(themePref)
      setLocale(language)
      setToast("Preferences saved")
    } catch {
      setToast("Could not save preferences")
    }
  }

  if (preferences.isPending) {
    return <ApiLoadingState label="Loading preferences…" />
  }
  if (
    preferences.isError &&
    preferences.error instanceof ApiClientError &&
    preferences.error.status === 401
  ) {
    return (
      <AccountShell
        title="Preferences"
        description="Language, theme, and rental defaults for search and checkout."
      >
        <p className="text-sm text-black/55 dark:text-white/55">
          <Link
            href="/login?next=%2Faccount%2Fpreferences"
            className="font-medium underline underline-offset-4"
          >
            Log in
          </Link>{" "}
          to save preferences on your account.
        </p>
      </AccountShell>
    )
  }
  if (preferences.isError) {
    return (
      <ApiErrorState
        error={preferences.error}
        retry={() => preferences.refetch()}
      />
    )
  }

  return (
    <>
      <AccountShell
        title="Preferences"
        description="Language, theme, and rental defaults for search and checkout."
      >
        <form className="space-y-0" onSubmit={handleSave}>
          <div className="grid gap-8 xl:grid-cols-2 xl:gap-10">
            <fieldset className="space-y-4 rounded-[12px] border border-black/10 p-5 dark:border-white/10 sm:p-6">
              <legend className="px-1 text-base font-semibold tracking-[-0.02em]">
                Language &amp; display
              </legend>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">App language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AppLocaleDto)}
                  className={fieldInputClass}
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </label>
              <div className="space-y-2">
                <span className="block text-sm font-medium">Theme</span>
                <div
                  className="flex w-full max-w-md rounded-[8px] border border-black/10 p-1 dark:border-white/10"
                  role="group"
                  aria-label="Theme preference"
                >
                  {(
                    [
                      ["system", "System"],
                      ["light", "Light"],
                      ["dark", "Dark"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setThemePref(value)}
                      className={`min-h-10 flex-1 rounded-[6px] px-3 text-sm font-semibold tracking-[-0.02em] transition-colors duration-200 ${
                        themePref === value
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-black/45 dark:text-white/45">
                  Applies immediately when you save.
                </p>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-[12px] border border-black/10 p-5 dark:border-white/10 sm:p-6">
              <legend className="px-1 text-base font-semibold tracking-[-0.02em]">
                Rental defaults
              </legend>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Default driver age band</span>
                <select
                  value={ageBand}
                  onChange={(e) => setAgeBand(e.target.value as AgeBand)}
                  className={fieldInputClass}
                >
                  <option value="21-24">21–24</option>
                  <option value="25-29">25–29</option>
                  <option value="30">30+</option>
                </select>
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Usual pickup area</span>
                <select
                  value={usualPickup}
                  onChange={(e) => setUsualPickup(e.target.value)}
                  className={fieldInputClass}
                >
                  {USUAL_PICKUP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-3">
                <span className="block text-sm font-medium">
                  Extras you often need
                </span>
                <ul className="grid gap-2 sm:grid-cols-1">
                  {EXTRA_OPTIONS.map(({ id, label }) => (
                    <li key={id}>
                      <label
                        htmlFor={`extra-${id}`}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[8px] border border-black/10 px-3 dark:border-white/10"
                      >
                        <Checkbox
                          id={`extra-${id}`}
                          checked={extras.includes(id)}
                          onCheckedChange={() => toggleExtra(id)}
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </fieldset>
          </div>

          <div className="mt-8 rounded-[12px] border border-black/10 bg-black/[0.02] px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="font-medium tracking-[-0.02em]">Currency</p>
            <p className="mt-1 max-w-3xl text-sm text-black/55 dark:text-white/55">
              All marketplace prices stay in Tunisian dinar (TND). This is not a
              multi-currency switcher.
            </p>
          </div>

          <div className="sticky bottom-4 z-10 mt-8 flex justify-end sm:static sm:bottom-auto">
            <Button
              type="submit"
              disabled={mutations.updatePreferences.isPending}
              className="h-11 w-full rounded-[8px] bg-black px-8 text-sm font-semibold text-white shadow-lg sm:w-auto sm:shadow-none dark:bg-white dark:text-black"
            >
              Save preferences
            </Button>
          </div>
        </form>
      </AccountShell>
      <BookingInlineToast message={toast} />
    </>
  )
}
