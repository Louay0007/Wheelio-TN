"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { fieldInputClass } from "@/components/account/password-fields"
import { useAdminSession } from "@/lib/admin-session"
import { authClient } from "@/lib/auth-client"

function MfaInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/admin"
  const { confirmMfa, session, ready } = useAdminSession()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.replace(/\s/g, "").length < 6) {
      setError("Enter a 6-digit authenticator code.")
      return
    }
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: true })
    if (result.error) {
      setError(result.error.message || "Invalid authenticator code.")
      return
    }
    confirmMfa()
    router.push(next.startsWith("/admin") ? next : "/admin")
  }

  if (ready && !session) {
    router.replace("/admin/login")
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Security"
        title="Confirm MFA"
        description="Finance and super roles need a second step before money or suspend actions."
      />
      <section className="mx-auto w-full max-w-md px-4 py-10">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-[12px] border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <label className="block text-sm font-medium">
            Authenticator code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              className={`${fieldInputClass} mt-1.5 border-zinc-300 font-mono tracking-[0.2em] dark:border-zinc-600`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
            />
          </label>
          {error ? (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="flex h-11 w-full cursor-pointer items-center justify-center rounded-[8px] bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
          >
            Confirm
          </button>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Signed in as {session?.email}.{" "}
            <Link href="/admin/logout" className="underline underline-offset-4">
              Log out
            </Link>
          </p>
        </form>
      </section>
    </PageShell>
  )
}

export default function AdminMfaPage() {
  return (
    <Suspense>
      <MfaInner />
    </Suspense>
  )
}
