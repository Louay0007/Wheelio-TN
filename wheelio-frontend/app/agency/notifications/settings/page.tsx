"use client"

import { useEffect, useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyPrimaryButton,
  AgencyTip,
} from "@/components/agency/agency-kit"
import { Checkbox } from "@/components/ui/checkbox"
import {
  fetchAgencyNotificationPreferences,
  putAgencyNotificationPreferences,
} from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

type PrefRow = {
  eventKey: string
  emailEnabled: boolean
  smsEnabled: boolean
  inAppEnabled: boolean
  emailLocked: boolean
}

const DEMO_KEYS = [
  ["request", "New request-to-book"],
  ["message", "Customer messages"],
  ["cancel", "Cancellations"],
  ["payout", "Payout paid"],
  ["sms", "SMS for SLA risk"],
] as const

export default function NotificationSettingsPage() {
  const api = useApiAgencySlice()
  const [demo, setDemo] = useState({
    request: true,
    message: true,
    cancel: true,
    payout: true,
    sms: false,
  })
  const [prefs, setPrefs] = useState<PrefRow[]>([])
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!api) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyNotificationPreferences()
      .then((rows) => {
        if (!cancelled) {
          setPrefs(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  async function save() {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await putAgencyNotificationPreferences(
        prefs.map((p) => ({
          eventKey: p.eventKey as
            | "booking_request"
            | "booking_message"
            | "cancellation"
            | "payout"
            | "sla_warning",
          emailEnabled: p.emailEnabled,
          smsEnabled: p.smsEnabled,
          inAppEnabled: p.inAppEnabled,
        })),
      )
      setPrefs(await fetchAgencyNotificationPreferences())
      setSaved(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  if (api) {
    return (
      <AgencyShell
        title="Notification settings"
        description="Email/SMS/in-app for desk events. Not 24/7."
      >
        <AgencyTip>
          booking_request email is transactional and cannot be disabled.
        </AgencyTip>
        {loading ? (
          <div className="mt-4 h-24 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        ) : (
          <div className="mt-4 max-w-lg space-y-3">
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <ul className="space-y-3">
              {prefs.map((p) => (
                <li
                  key={p.eventKey}
                  className="rounded-[10px] border border-zinc-200 px-3 py-3 text-sm dark:border-zinc-700"
                >
                  <p className="font-semibold">{p.eventKey}</p>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={p.emailEnabled}
                        disabled={p.emailLocked}
                        onCheckedChange={(v) =>
                          setPrefs((rows) =>
                            rows.map((r) =>
                              r.eventKey === p.eventKey
                                ? { ...r, emailEnabled: Boolean(v) }
                                : r,
                            ),
                          )
                        }
                      />
                      Email{p.emailLocked ? " (locked)" : ""}
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={p.smsEnabled}
                        onCheckedChange={(v) =>
                          setPrefs((rows) =>
                            rows.map((r) =>
                              r.eventKey === p.eventKey
                                ? { ...r, smsEnabled: Boolean(v) }
                                : r,
                            ),
                          )
                        }
                      />
                      SMS
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={p.inAppEnabled}
                        onCheckedChange={(v) =>
                          setPrefs((rows) =>
                            rows.map((r) =>
                              r.eventKey === p.eventKey
                                ? { ...r, inAppEnabled: Boolean(v) }
                                : r,
                            ),
                          )
                        }
                      />
                      In-app
                    </label>
                  </div>
                </li>
              ))}
            </ul>
            <AgencyPrimaryButton
              type="button"
              disabled={busy}
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save preferences"}
            </AgencyPrimaryButton>
            {saved ? (
              <p className="text-sm text-zinc-500">Saved.</p>
            ) : null}
          </div>
        )}
      </AgencyShell>
    )
  }

  return (
    <AgencyShell
      title="Notification settings"
      description="Email/SMS/WhatsApp for desk events. Not 24/7."
    >
      <ul className="max-w-md space-y-3">
        {DEMO_KEYS.map(([key, label]) => (
          <li key={key} className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={demo[key]}
              onCheckedChange={(v) =>
                setDemo((p) => ({ ...p, [key]: Boolean(v) }))
              }
            />
            {label}
          </li>
        ))}
      </ul>
    </AgencyShell>
  )
}
