"use client"

import Link from "next/link"
import { useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { fieldInputClass } from "@/components/account/password-fields"

export default function AdminForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  return (
    <PageShell>
      <PageHero
        eyebrow="Wheelio staff"
        title="Reset admin password"
        description="Demo only. No email is sent."
      />
      <section className="mx-auto max-w-md px-4 py-10">
        {sent ? (
          <p className="rounded-[10px] border border-zinc-200 p-5 text-sm dark:border-zinc-700">
            Check your inbox (demo).{" "}
            <Link href="/admin/reset-password" className="underline underline-offset-4">
              Continue to reset
            </Link>
          </p>
        ) : (
          <form
            className="space-y-4 rounded-[12px] border border-zinc-200 p-5 dark:border-zinc-700"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <label className="block text-sm font-medium">
              Work email
              <input type="email" required className={`${fieldInputClass} mt-1.5 border-zinc-300 dark:border-zinc-600`} />
            </label>
            <button
              type="submit"
              className="h-11 w-full cursor-pointer rounded-[8px] bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
            >
              Email reset link
            </button>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              <Link href="/admin/login" className="underline underline-offset-4">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </section>
    </PageShell>
  )
}
