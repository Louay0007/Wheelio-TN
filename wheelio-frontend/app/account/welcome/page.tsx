"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AccountShell } from "@/components/account/account-shell"
import { fieldInputClass } from "@/components/account/password-fields"
import { ApiClientError } from "@/lib/api/client"
import { useAccountMutations, useMe } from "@/lib/query/account"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"

const STEPS = ["Contact", "Primary driver", "Claim booking"] as const

export default function WelcomePage() {
  const router = useRouter()
  const me = useMe()
  const mutations = useAccountMutations()
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (me.data) setPhone(me.data.profile.phone ?? "")
  }, [me.data])

  async function finishWelcome() {
    if (!me.data) return
    setError(null)
    try {
      await mutations.updateProfile.mutateAsync({
        phone: phone.trim() || null,
        welcomeCompleted: true,
        version: me.data.profile.version,
      })
      router.push("/account")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not finish setup")
    }
  }

  if (me.isPending) return <ApiLoadingState label="Loading account setup…" />
  if (
    me.isError &&
    me.error instanceof ApiClientError &&
    me.error.status === 401
  ) {
    return (
      <AccountShell title="Welcome" description="Sign in to finish account setup.">
        <Link
          href="/login?next=%2Faccount%2Fwelcome"
          className="text-sm font-medium underline underline-offset-4"
        >
          Log in
        </Link>
      </AccountShell>
    )
  }
  if (me.isError) {
    return <ApiErrorState error={me.error} retry={() => me.refetch()} />
  }
  if (me.data.profile.welcomeCompleted) {
    return (
      <AccountShell title="Welcome" description="You already completed onboarding.">
        <Link href="/account" className="text-sm font-medium underline underline-offset-4">
          Go to account home
        </Link>
      </AccountShell>
    )
  }

  return (
    <AccountShell
      title="Welcome to Wheelio"
      description="Three quick steps — skip anything you do not need right now."
      eyebrow="Getting started"
    >
      <div className="mb-8 flex items-center justify-center gap-2" aria-label="Progress">
        {STEPS.map((label, index) => (
          <span
            key={label}
            className={`size-2.5 rounded-full ${
              index === step
                ? "bg-black dark:bg-white"
                : index < step
                  ? "bg-black/40 dark:bg-white/40"
                  : "bg-black/15 dark:bg-white/15"
            }`}
            aria-label={`${label}${index === step ? " (current)" : ""}`}
          />
        ))}
      </div>

      <p className="mb-6 text-center text-sm font-medium">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>
      {error ? (
        <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {step === 0 ? (
        <div className="mx-auto max-w-md space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Mobile number</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+216 …"
              className={fieldInputClass}
            />
          </label>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="h-11 rounded-[7px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mx-auto max-w-md space-y-4 text-sm">
          <p className="text-black/60 dark:text-white/60">
            Save a licence holder to pre-fill driver details during checkout.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/account/drivers/new"
              className="inline-flex h-11 items-center rounded-[7px] bg-black px-4 font-semibold text-white dark:bg-white dark:text-black"
            >
              Add a driver
            </Link>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="h-11 rounded-[7px] border border-black/15 px-4 font-medium dark:border-white/15"
            >
              Skip
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mx-auto max-w-md space-y-4 text-sm">
          <p className="text-black/60 dark:text-white/60">
            Already booked as a guest? Claim the booking after account setup.
          </p>
          <Link
            href="/account/claim"
            className="block font-medium underline underline-offset-4"
          >
            Open booking claim
          </Link>
          <button
            type="button"
            onClick={() => void finishWelcome()}
            disabled={mutations.updateProfile.isPending}
            className="h-11 rounded-[7px] bg-black px-4 font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {mutations.updateProfile.isPending ? "Finishing…" : "Finish setup"}
          </button>
        </div>
      ) : null}
    </AccountShell>
  )
}
