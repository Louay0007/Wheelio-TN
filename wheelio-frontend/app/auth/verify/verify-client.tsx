"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHero, PageShell } from "@/components/page-shell"
import { useMe } from "@/lib/query/account"

export function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const me = useMe()

  const email = searchParams.get("email") ?? ""
  const state = searchParams.get("state") ?? "verified"

  const copy =
    state === "expired"
      ? "This link expired. Request a new sign-in email."
      : state === "used"
        ? "This link was already used. Log in with your password instead."
        : "Your email verification link has been processed."

  function handleContinue() {
    if (me.data && !me.data.profile.welcomeCompleted) {
      router.push("/account/welcome")
      return
    }
    router.push(me.data ? "/account" : "/login")
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Account"
        title="Verify email"
        description="Complete verification, then continue to your account."
      />
      <section className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-[8px] border border-black/10 p-5 dark:border-white/10">
          <p className="font-semibold tracking-[-0.02em]">
            {state === "expired"
              ? "Link expired"
              : state === "used"
                ? "Link already used"
                : "Email verified"}
          </p>
          <p className="mt-2 text-sm text-black/55 dark:text-white/55">{copy}</p>
          {email ? (
            <p className="mt-2 text-sm">
              <span className="text-black/45 dark:text-white/45">Address: </span>
              {email}
            </p>
          ) : null}
        </div>
        {state === "verified" ? (
          <button
            type="button"
            onClick={handleContinue}
            className="mt-6 flex h-11 w-full items-center justify-center rounded-[7px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Continue
          </button>
        ) : null}
        {state !== "verified" ? (
          <p className="mt-6 text-sm">
            <Link href="/login" className="underline underline-offset-4">
              Back to log in
            </Link>
            {" · "}
            <Link href="/auth/magic" className="underline underline-offset-4">
              Request magic link
            </Link>
          </p>
        ) : null}
      </section>
    </PageShell>
  )
}
