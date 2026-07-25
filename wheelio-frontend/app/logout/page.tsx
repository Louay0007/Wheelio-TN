"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { PageHero, PageShell } from "@/components/page-shell"
import { authClient } from "@/lib/auth-client"
import { useMe } from "@/lib/query/account"

export default function LogoutPage() {
  const me = useMe()
  const queryClient = useQueryClient()
  const isSignedIn = Boolean(me.data)
  const router = useRouter()

  async function confirmLogout() {
    await authClient.signOut()
    queryClient.clear()
    router.push("/?signedOut=1")
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Account"
        title="Log out"
        description="End your session on this device."
      />
      <section className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
        {isSignedIn ? (
          <>
            <p className="text-sm text-black/55 dark:text-white/55">
              You will stay able to book and find trips as a guest.
            </p>
            <button
              type="button"
              onClick={() => void confirmLogout()}
              className="mt-6 flex h-11 w-full items-center justify-center rounded-[7px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Log out
            </button>
          </>
        ) : (
          <p className="text-sm text-black/55 dark:text-white/55">
            You are not signed in.{" "}
            <Link href="/" className="underline underline-offset-4">
              Back home
            </Link>
          </p>
        )}
        <Link href="/account" className="mt-6 inline-block text-sm underline underline-offset-4">
          Cancel
        </Link>
      </section>
    </PageShell>
  )
}
