"use client"

import Link from "next/link"
import { useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { fieldInputClass } from "@/components/account/password-fields"

export default function AgencyForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  return (
    <PageShell>
      <PageHero eyebrow="Agency" title="Reset portal password" description="Demo only - no email is sent." />
      <section className="mx-auto max-w-md px-4 py-10">
        {sent ? (
          <p className="rounded-[10px] border border-zinc-200 dark:border-zinc-700 p-5 text-sm">
            Check your inbox (demo).{" "}
            <Link href="/agency/reset-password" className="underline">
              Continue to reset
            </Link>
          </p>
        ) : (
          <form
            className="space-y-4 rounded-[12px] border border-zinc-200 dark:border-zinc-700 p-5"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <label className="block text-sm font-medium">
              Work email
              <input type="email" required className={`${fieldInputClass} mt-1.5`} />
            </label>
            <button type="submit" className="h-11 w-full cursor-pointer rounded-[8px] bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
              Email reset link
            </button>
          </form>
        )}
      </section>
    </PageShell>
  )
}
