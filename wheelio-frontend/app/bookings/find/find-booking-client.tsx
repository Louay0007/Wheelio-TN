"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { findBookingByReference } from "@/lib/bookings"
import { cn } from "@/lib/utils"

export function FindBookingClient() {
  const router = useRouter()
  const [reference, setReference] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const match = findBookingByReference(reference, email)
    if (match) {
      router.push(`/bookings/${match.id}?found=1`)
      return
    }

    setSubmitting(false)
    setError(
      "We couldn’t match that reference and email. Check for typos or use the email from checkout.",
    )
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Guest access"
        title="Find your booking"
        description="Enter the reference from your confirmation and the email you used at checkout."
      />

      <section className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Booking reference</span>
            <input
              type="text"
              name="reference"
              autoComplete="off"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="WTN-240001"
              spellCheck={false}
              className="h-11 w-full rounded-[7px] border border-black/15 bg-transparent px-3 font-mono text-sm uppercase tracking-[-0.02em] dark:border-white/15"
              aria-describedby="reference-hint"
            />
            <span
              id="reference-hint"
              className="text-xs text-black/45 dark:text-white/45"
            >
              From your confirmation email or SMS
            </span>
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-[7px] border border-black/15 bg-transparent px-3 dark:border-white/15"
            />
          </label>

          {error ? (
            <div
              role="alert"
              className="rounded-[8px] border border-black/15 bg-black/[0.03] px-4 py-3 text-sm leading-relaxed text-black/70 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/70"
            >
              {error}{" "}
              <Link
                href="/help"
                className="font-semibold text-black underline underline-offset-4 dark:text-white"
              >
                Contact support
              </Link>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={cn("flex h-11 w-full items-center justify-center rounded-[7px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black",
              submitting && "opacity-70",
            )}
          >
            {submitting ? "Opening…" : "Find booking"}
          </button>
        </form>

        <p className="mt-8 text-xs leading-relaxed text-black/45 dark:text-white/45">
          We only use your reference and email to locate this booking. We never
          share trip details with third parties. Demo:{" "}
          <span className="font-mono">amine@example.com</span> with a reference
          from your trips list.
        </p>
      </section>
    </PageShell>
  )
}
