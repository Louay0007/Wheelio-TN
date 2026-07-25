"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import {
  fieldInputClass,
  PasswordFields,
} from "@/components/account/password-fields"
import { useAgencySession } from "@/lib/agency-session"

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/agency"
  const { login } = useAgencySession()
  const [email, setEmail] = useState("sami@carthagedrive.tn")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || password.length < 4) {
      setError("Enter your work email and a password (demo: any 4+ characters).")
      return
    }
    setLoading(true)
    login({ email })
    setTimeout(() => router.push(next), 200)
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="For agencies"
        title="Agency sign in"
        description="Sign in to manage cars, bookings, and desk pickups. Travellers use a different login."
      />
      <section className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-[12px] border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 sm:p-6"
        >
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Work email
            <input
              type="email"
              className={`${fieldInputClass} mt-1.5 border-zinc-300 text-zinc-950 dark:border-zinc-600 dark:text-zinc-50`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <PasswordFields
            passwordValue={password}
            onPasswordChange={setPassword}
            showConfirm={false}
            autoComplete="current-password"
          />
          {error ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full cursor-pointer items-center justify-center rounded-[8px] bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <p>
              <Link
                href="/agency/forgot-password"
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
              >
                Forgot password?
              </Link>
            </p>
            <p>
              New partner?{" "}
              <Link
                href="/partners/join"
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
              >
                Apply here
              </Link>
            </p>
            <p>
              Looking for your rental?{" "}
              <Link
                href="/bookings/find"
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
              >
                Find a booking
              </Link>
            </p>
            <p>
              Traveller account:{" "}
              <Link
                href="/login"
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
              >
                Customer login
              </Link>
            </p>
          </div>
        </form>
      </section>
    </PageShell>
  )
}

export default function AgencyLoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
