"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { fieldInputClass, PasswordFields } from "@/components/account/password-fields"
import { useAdminSession } from "@/lib/admin-session"
import { roleNeedsMfa } from "@/lib/admin"

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/admin"
  const { login } = useAdminSession()
  const [email, setEmail] = useState("admin@wheelio.tn")
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
    const session = login({ email })
    const dest =
      roleNeedsMfa(session.role) && !session.mfaOk
        ? `/admin/mfa?next=${encodeURIComponent(next)}`
        : next.startsWith("/admin")
          ? next
          : "/admin"
    setTimeout(() => router.push(dest), 150)
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Wheelio staff"
        title="Admin sign in"
        description="For Wheelio employees only. Agencies and travellers use different logins."
      />
      <section className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-[12px] border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900 sm:p-6"
        >
          <label className="block text-sm font-medium">
            Work email
            <input
              type="email"
              className={`${fieldInputClass} mt-1.5 border-zinc-300 dark:border-zinc-600`}
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
            className="flex h-11 w-full cursor-pointer items-center justify-center rounded-[8px] bg-zinc-950 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <p className="text-xs">
              Demo emails: admin@wheelio.tn · support@wheelio.tn · finance@wheelio.tn ·
              partners@wheelio.tn
            </p>
            <p>
              <Link href="/agency/login" className="font-medium underline underline-offset-4">
                Agency portal
              </Link>
              {" · "}
              <Link href="/login" className="font-medium underline underline-offset-4">
                Customer login
              </Link>
            </p>
          </div>
        </form>
      </section>
    </PageShell>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
