"use client"

import Link from "next/link"
import { useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { PasswordFields } from "@/components/account/password-fields"

export default function AdminResetPasswordPage() {
  const [done, setDone] = useState(false)
  return (
    <PageShell>
      <PageHero eyebrow="Wheelio staff" title="Choose a new password" />
      <section className="mx-auto max-w-md px-4 py-10">
        {done ? (
          <p className="text-sm">
            Password updated (demo).{" "}
            <Link href="/admin/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        ) : (
          <form
            className="space-y-4 rounded-[12px] border border-zinc-200 p-5 dark:border-zinc-700"
            onSubmit={(e) => {
              e.preventDefault()
              setDone(true)
            }}
          >
            <PasswordFields showConfirm showStrength />
            <button
              type="submit"
              className="h-11 w-full cursor-pointer rounded-[8px] bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
            >
              Save password
            </button>
          </form>
        )}
      </section>
    </PageShell>
  )
}
