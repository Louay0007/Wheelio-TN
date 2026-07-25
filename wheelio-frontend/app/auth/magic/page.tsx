"use client"

import { useEffect, useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { AuthEscapeLinks } from "@/components/account/auth-escape-links"
import { fieldInputClass } from "@/components/account/password-fields"
import { authClient } from "@/lib/auth-client"

export default function MagicLinkPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [cooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const result = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: "/account",
    })
    setLoading(false)
    if (result.error) return
    setSent(true)
    setCooldown(60)
  }

  async function handleResend() {
    if (cooldown > 0) return
    setLoading(true)
    await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: "/account",
    })
    setLoading(false)
    setCooldown(60)
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Account"
        title="Magic link"
        description="Passwordless sign-in by email. Guest booking never requires this."
      />
      <section className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
        {sent ? (
          <div className="space-y-4 rounded-[8px] border border-black/10 p-5 dark:border-white/10">
            <p className="font-semibold tracking-[-0.02em]">Check your inbox</p>
            <p className="text-sm text-black/55 dark:text-white/55">
              We sent a one-time sign-in link to {email}.
            </p>
            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={handleResend}
              className="text-sm font-medium underline underline-offset-4 disabled:no-underline disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={fieldInputClass}
                placeholder="you@example.com"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-[7px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              {loading ? "Sending…" : "Email me a link"}
            </button>
          </form>
        )}
        <AuthEscapeLinks mode="login" className="mt-8" />
      </section>
    </PageShell>
  )
}
