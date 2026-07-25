"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { PasswordFields } from "@/components/account/password-fields"
import { useAgencySession } from "@/lib/agency-session"

export default function AgencyInvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const { login } = useAgencySession()
  const [password, setPassword] = useState("")
  const expired = token === "expired"

  return (
    <PageShell>
      <PageHero
        eyebrow="Team invite"
        title={expired ? "Invite expired" : "Join Carthage Drive"}
        description={
          expired
            ? "Ask your owner to resend an invite."
            : "Role: Reservation agent · Set a password to enter the portal."
        }
      />
      <section className="mx-auto max-w-md px-4 py-10">
        {expired ? (
          <Link href="/agency/login" className="underline">
            Back to login
          </Link>
        ) : (
          <form
            className="space-y-4 rounded-[12px] border border-zinc-200 dark:border-zinc-700 p-5"
            onSubmit={(e) => {
              e.preventDefault()
              login({ email: "nour@carthagedrive.tn", role: "agent" })
              router.push("/agency")
            }}
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Invited as nour@carthagedrive.tn</p>
            <PasswordFields passwordValue={password} onPasswordChange={setPassword} showConfirm showStrength />
            <button type="submit" className="h-11 w-full cursor-pointer rounded-[8px] bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
              Accept invite
            </button>
          </form>
        )}
      </section>
    </PageShell>
  )
}
