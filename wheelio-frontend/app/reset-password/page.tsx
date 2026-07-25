"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { AuthEscapeLinks } from "@/components/account/auth-escape-links"
import { PasswordFields } from "@/components/account/password-fields"
import { BookingInlineToast } from "@/components/bookings/booking-inline-toast"
import { authClient } from "@/lib/auth-client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    if (String(form.get("passwordConfirm") ?? "") !== password) {
      setToast("Passwords do not match")
      return
    }
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      setToast("This reset link is missing or invalid")
      return
    }
    setLoading(true)
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    setLoading(false)
    if (result.error) {
      setToast(result.error.message || "Could not reset password")
      return
    }
    setToast("Password updated")
    window.setTimeout(() => router.push("/login"), 1200)
  }

  return (
    <>
      <PageShell>
        <PageHero
          eyebrow="Account"
          title="Reset password"
          description="Choose a new password for your account."
        />
        <section className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <PasswordFields
              showConfirm
              showStrength
              passwordValue={password}
              onPasswordChange={setPassword}
            />
            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="flex h-11 w-full items-center justify-center rounded-[7px] bg-black text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
          <AuthEscapeLinks mode="login" className="mt-8" />
          <p className="mt-4 text-center text-sm text-black/55 dark:text-white/55">
            <Link href="/forgot-password" className="underline underline-offset-4">
              Request a new link
            </Link>
          </p>
        </section>
      </PageShell>
      <BookingInlineToast message={toast} />
    </>
  )
}
