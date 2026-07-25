"use client"

import { useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { AuthEscapeLinks } from "@/components/account/auth-escape-links"
import { fieldInputClass } from "@/components/account/password-fields"
import { authClient } from "@/lib/auth-client"

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Account"
        title="Forgot password"
        description="Request a secure, time-limited password reset link."
      />
      <section className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
        {sent ? (
          <p className="rounded-[8px] border border-black/10 px-4 py-3 text-sm dark:border-white/10">
            If an account exists for that email, reset instructions have been sent.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Email</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={fieldInputClass}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-[7px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <AuthEscapeLinks mode="login" className="mt-8" />
      </section>
    </PageShell>
  )
}
