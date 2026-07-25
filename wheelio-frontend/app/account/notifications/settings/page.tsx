"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AccountShell } from "@/components/account/account-shell"
import { BookingInlineToast } from "@/components/bookings/booking-inline-toast"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  type NotificationChannelPref,
} from "@/lib/user"
import { ApiClientError } from "@/lib/api/client"
import {
  useAccountMutations,
  useNotificationPreferences,
  usePreferences,
} from "@/lib/query/account"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"

const NOTIFICATION_ROWS = [
  { key: "booking_updates", label: "Booking updates", hint: "Confirmations and changes" },
  { key: "pickup_reminders", label: "Pickup reminders", hint: "Day-before and hour-before" },
  { key: "agency_messages", label: "Agency messages", hint: "Desk notes about your car" },
  { key: "payment_receipts", label: "Payment receipts", hint: "Deposits and refunds" },
] as const

const switchMono =
  "data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=unchecked]:bg-black/15 dark:data-[state=unchecked]:bg-white/20"

type PrefsState = Record<string, NotificationChannelPref>

function clonePrefs(source: PrefsState): PrefsState {
  const next: PrefsState = {}
  for (const row of NOTIFICATION_ROWS) {
    const base = source[row.key] ?? { email: true, sms: false }
    next[row.key] = { ...base }
  }
  return next
}

export default function NotificationSettingsPage() {
  const notificationQuery = useNotificationPreferences()
  const preferencesQuery = usePreferences()
  const mutations = useAccountMutations()
  const [prefs, setPrefs] = useState<PrefsState>({})
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!notificationQuery.data || !preferencesQuery.data) return
    setPrefs(clonePrefs(notificationQuery.data.preferences))
    setMarketingOptIn(preferencesQuery.data.marketingOptIn)
  }, [notificationQuery.data, preferencesQuery.data])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  function setChannel(
    key: string,
    channel: keyof NotificationChannelPref,
    value: boolean,
  ) {
    setPrefs((prev) => ({
      ...prev,
      [key]: { ...prev[key]!, [channel]: value },
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!preferencesQuery.data) return
    try {
      await mutations.updateNotificationPreferences.mutateAsync({
        preferences: { ...notificationQuery.data?.preferences, ...prefs },
      })
      await mutations.updatePreferences.mutateAsync({
        marketingOptIn,
        version: preferencesQuery.data.version,
      })
      setToast("Notification settings saved")
    } catch {
      setToast("Could not save notification settings")
    }
  }

  if (notificationQuery.isPending || preferencesQuery.isPending) {
    return <ApiLoadingState label="Loading notification settings…" />
  }
  const authError = [notificationQuery.error, preferencesQuery.error].find(
    (error) => error instanceof ApiClientError && error.status === 401,
  )
  if (authError) {
    return (
      <AccountShell
        title="Notification settings"
        description="Choose how we reach you about trips and payments."
      >
        <p className="text-sm text-black/55 dark:text-white/55">
          <Link
            href="/login?next=%2Faccount%2Fnotifications%2Fsettings"
            className="font-medium underline underline-offset-4"
          >
            Log in
          </Link>{" "}
          to manage email and SMS preferences.
        </p>
      </AccountShell>
    )
  }
  if (notificationQuery.isError) {
    return (
      <ApiErrorState
        error={notificationQuery.error}
        retry={() => notificationQuery.refetch()}
      />
    )
  }
  if (preferencesQuery.isError) {
    return (
      <ApiErrorState
        error={preferencesQuery.error}
        retry={() => preferencesQuery.refetch()}
      />
    )
  }

  return (
    <>
      <AccountShell
        title="Notification settings"
        description="Choose how we reach you about trips and payments."
      >
        <p className="mb-6 text-sm">
          <Link
            href="/account/notifications"
            className="font-medium underline underline-offset-4"
          >
            ← Back to notifications feed
          </Link>
        </p>

        <form className="space-y-8" onSubmit={handleSave}>
          <div className="overflow-x-auto rounded-[8px] border border-black/10 dark:border-white/10">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/45 dark:border-white/10 dark:text-white/45">
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">SMS</th>
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_ROWS.map((row) => {
                  const pref = prefs[row.key] ?? { email: true, sms: false }
                  return (
                    <tr
                      key={row.key}
                      className="dark:border-white/10"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium tracking-[-0.02em]">{row.label}</p>
                        <p className="text-xs text-black/45 dark:text-white/45">
                          {row.hint}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={pref.email}
                          onCheckedChange={(v) => setChannel(row.key, "email", v)}
                          className={switchMono}
                          aria-label={`${row.label} email`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={pref.sms}
                          onCheckedChange={(v) => setChannel(row.key, "sms", v)}
                          className={switchMono}
                          aria-label={`${row.label} SMS`}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-black/50 dark:text-white/50">
            SMS is sent during desk hours Sun–Thu, 09:00–18:00 Tunisia time.
          </p>

          <fieldset className="space-y-3 rounded-[8px] border border-black/10 p-4 dark:border-white/10">
            <legend className="px-1 text-sm font-semibold tracking-[-0.02em]">
              Marketing
            </legend>
            <p className="text-xs text-black/50 dark:text-white/50">
              Separate from trip alerts. Email only; off by default.
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm">Deals and destination tips</span>
              <Switch
                checked={marketingOptIn}
                onCheckedChange={setMarketingOptIn}
                className={switchMono}
                aria-label="Marketing email opt-in"
              />
            </div>
          </fieldset>

          <Button
            type="submit"
            disabled={
              mutations.updateNotificationPreferences.isPending ||
              mutations.updatePreferences.isPending
            }
            className="h-11 rounded-[7px] bg-black px-6 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Save settings
          </Button>
        </form>
      </AccountShell>
      <BookingInlineToast message={toast} />
    </>
  )
}
