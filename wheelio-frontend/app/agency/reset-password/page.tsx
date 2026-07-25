"use client"

import Link from "next/link"
import { useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { PasswordFields } from "@/components/account/password-fields"

export default function AgencyResetPasswordPage() {
  const [done, setDone] = useState(false)
  return (
    <PageShell>
      <PageHero eyebrow="Agency" title="Choose a new password" />
      <section className="mx-auto max-w-md px-4 py-10">
        {done ? (
          <p className="text-sm">
            Password updated (demo).{" "}
            <Link href="/agency/login" className="underline">
              Sign in
            </Link>
          </p>
        ) : (
          <form
            className="space-y-4 rounded-[12px] border border-zinc-200 dark:border-zinc-700 p-5"
            onSubmit={(e) => {
              e.preventDefault()
              setDone(true)
            }}
          >
            <PasswordFields showConfirm showStrength />
            <button type="submit" className="h-11 w-full cursor-pointer rounded-[8px] bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
              Save password
            </button>
          </form>
        )}
      </section>
    </PageShell>
  )
}
