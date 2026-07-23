"use client"

import Link from "next/link"
import { PageHero, PageShell } from "@/components/page-shell"

export function AuthForm({
  mode,
}: {
  mode: "login" | "signup"
}) {
  const isLogin = mode === "login"

  return (
    <PageShell>
      <PageHero
        eyebrow="Account"
        title={isLogin ? "Log in" : "Create an account"}
        description={
          isLogin
            ? "Demo UI only — authentication is not live yet. You can still book as a guest."
            : "Demo UI only — accounts are not live yet. Guest checkout remains available."
        }
      />

      <section className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          {!isLogin ? (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Full name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                className="h-11 w-full rounded-[7px] border border-black/15 bg-transparent px-3 dark:border-white/15"
              />
            </label>
          ) : null}

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="h-11 w-full rounded-[7px] border border-black/15 bg-transparent px-3 dark:border-white/15"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Password</span>
            <input
              type="password"
              name="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              placeholder="••••••••"
              className="h-11 w-full rounded-[7px] border border-black/15 bg-transparent px-3 dark:border-white/15"
            />
          </label>

          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center rounded-[7px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            {isLogin ? "Log in (demo)" : "Sign up (demo)"}
          </button>
        </form>

        <p className="mt-6 rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-relaxed text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
          Prefer not to create an account?{" "}
          <Link href="/search" className="font-medium underline underline-offset-4">
            Continue as guest
          </Link>{" "}
          — checkout never requires an account.
        </p>

        <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">
          {isLogin ? (
            <>
              No account?{" "}
              <Link href="/signup" className="font-medium underline underline-offset-4">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link href="/login" className="font-medium underline underline-offset-4">
                Log in
              </Link>
            </>
          )}
        </p>
      </section>
    </PageShell>
  )
}
