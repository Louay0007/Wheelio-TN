"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AccountShell } from "@/components/account/account-shell"
import {
  fieldInputClass,
  PasswordFields,
} from "@/components/account/password-fields"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import { BookingInlineToast } from "@/components/bookings/booking-inline-toast"
import { Button } from "@/components/ui/button"
import { ApiClientError } from "@/lib/api/client"
import { authClient } from "@/lib/auth-client"
import { MfaSettings } from "@/components/account/mfa-settings"
import {
  useAccountMutations,
  useSecurityOverview,
  useSessions,
} from "@/lib/query/account"

export default function SecurityPage() {
  const sessions = useSessions()
  const mutations = useAccountMutations()
  const security = useSecurityOverview()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const currentPassword = String(form.get("currentPassword") ?? "")
    const newPassword = String(form.get("password") ?? "")
    const confirmPassword = String(form.get("passwordConfirm") ?? "")
    if (newPassword !== confirmPassword) {
      setToast("New passwords do not match")
      return
    }
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    })
    if (result.error) {
      setToast(result.error.message || "Could not update password")
      return
    }
    e.currentTarget.reset()
    setToast("Password updated")
  }

  async function revokeSession(id: string) {
    try {
      await mutations.revokeSession.mutateAsync(id)
      setToast("Session revoked")
    } catch {
      setToast("Could not revoke session")
    }
  }

  async function revokeOthers() {
    try {
      await mutations.revokeOtherSessions.mutateAsync()
      setToast("Other sessions revoked")
    } catch (error) {
      setToast(error instanceof ApiClientError ? error.message : "Could not revoke other sessions")
    }
  }

  if (sessions.isPending) return <ApiLoadingState label="Loading security settings…" />
  const unauthenticated =
    sessions.isError &&
    sessions.error instanceof ApiClientError &&
    sessions.error.status === 401
  if (sessions.isError && !unauthenticated) {
    return <ApiErrorState error={sessions.error} retry={() => sessions.refetch()} />
  }

  return (
    <>
      <AccountShell
        title="Security"
        description="Password, sign-in methods, and active account sessions."
      >
        {unauthenticated ? (
          <p className="mb-8 text-sm text-black/55 dark:text-white/55">
            <Link
              href="/login?next=%2Faccount%2Fsecurity"
              className="font-medium underline underline-offset-4"
            >
              Log in
            </Link>{" "}
            to manage security settings.
          </p>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Change password</h2>
          <form className="max-w-md space-y-4" onSubmit={handlePassword}>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Current password</span>
              <input
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                className={fieldInputClass}
                required
              />
            </label>
            <PasswordFields
              passwordLabel="New password"
              showConfirm
              showStrength
              autoComplete="new-password"
            />
            <Button
              type="submit"
              disabled={unauthenticated}
              className="h-11 rounded-[7px] bg-black px-6 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Update password
            </Button>
          </form>
          <p className="text-xs text-black/45 dark:text-white/45">
            Prefer email reset?{" "}
            <Link href="/forgot-password" className="underline underline-offset-4">
              Forgot password
            </Link>
          </p>
        </section>

        <section className="mt-10 space-y-3 pt-8 dark:border-white/10">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Sign-in methods</h2>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-black/10 p-4 dark:border-white/10">
            <div>
              <p className="font-medium tracking-[-0.02em]">Magic link email</p>
              <p className="text-sm text-black/55 dark:text-white/55">
                Passwordless sign-in is available from the login page.
              </p>
            </div>
          </div>
          <MfaSettings enabled={security.data?.mfa.enabled ?? false} onChanged={() => security.refetch()} notify={setToast} />
        </section>

        <section className="mt-10 space-y-4 pt-8 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Active sessions</h2>
            <Button type="button" variant="outline" disabled={unauthenticated || mutations.revokeOtherSessions.isPending} onClick={revokeOthers}>
              Revoke other sessions
            </Button>
          </div>
          <ul className="space-y-3">
            {sessions.data?.length === 0 ? (
              <li className="text-sm text-black/55 dark:text-white/55">
                No active sessions.
              </li>
            ) : (
              sessions.data?.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-[8px] border border-black/10 p-4 dark:border-white/10"
                >
                  <div>
                    <p className="font-medium tracking-[-0.02em]">
                      {s.userAgent || "Unknown browser"}
                    </p>
                    <p className="text-sm text-black/55 dark:text-white/55">
                      {s.ipAddress || "Unknown location"} · expires{" "}
                      {new Date(s.expiresAt).toLocaleString()}
                    </p>
                    {s.current ? (
                      <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">
                        Current session
                      </span>
                    ) : null}
                  </div>
                  {!s.current && !unauthenticated ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-[8px] border-black/15 dark:border-white/15"
                      onClick={() => revokeSession(s.id)}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-10 space-y-4 pt-8 dark:border-white/10">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Recent security activity</h2>
          <ul className="space-y-2">
            {security.data?.events.length ? security.data.events.map((event) => (
              <li key={event.id} className="rounded-[8px] border border-black/10 p-3 text-sm dark:border-white/10">
                <p className="font-medium">{event.action.replaceAll(".", " ")}</p>
                <p className="text-black/55 dark:text-white/55">{new Date(event.occurredAt).toLocaleString()} · {event.ipAddress || "Unknown IP"}</p>
              </li>
            )) : <li className="text-sm text-black/55 dark:text-white/55">No security events recorded yet.</li>}
          </ul>
        </section>

      </AccountShell>
      <BookingInlineToast message={toast} />
    </>
  )
}
