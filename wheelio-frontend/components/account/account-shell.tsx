"use client"

import Link from "next/link"
import { HelpCircle, Mail } from "lucide-react"
import type { ReactNode } from "react"
import { PageShell } from "@/components/page-shell"
import { DemoSessionBanner } from "@/components/account/demo-session-banner"
import { AccountSubnav } from "@/components/account/account-subnav"
import { UserAvatar } from "@/components/account/user-avatar"
import { useDemoSession } from "@/lib/use-demo-session"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

type AccountShellProps = {
  title: string
  description?: string
  eyebrow?: string
  children: ReactNode
  className?: string
  /** Optional actions aligned with the page title (e.g. Save) */
  actions?: ReactNode
}

export function AccountShell({
  title,
  description,
  eyebrow = "Account",
  children,
  className,
  actions,
}: AccountShellProps) {
  const { user, ready, isSignedIn } = useDemoSession()
  const { tx } = useLocale()

  const displayName = user?.preferredName || user?.name || tx("Guest")
  const email = user?.email ?? tx("Not signed in")

  return (
    <PageShell>
      {/* Full-bleed identity ribbon */}
      <header className="bg-black/[0.015] dark:bg-white/[0.02]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-7">
          <div className="flex min-w-0 items-center gap-4">
            {ready && isSignedIn && user ? (
              <UserAvatar user={user} size="lg" />
            ) : (
              <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed border-black/20 text-sm font-medium text-black/40 dark:border-white/20 dark:text-white/40">
                —
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold tracking-[-0.03em] sm:text-xl">
                  {displayName}
                </p>
                <span
                  className={cn(
                    "rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                    isSignedIn
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-black/20 text-black/55 dark:border-white/20 dark:text-white/55",
                  )}
                >
                  {isSignedIn ? tx("Signed in demo") : tx("Guest preview")}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-black/55 dark:text-white/55">
                {email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Link
              href="/trips"
              className="inline-flex h-11 items-center rounded-[8px] border border-black/15 px-4 text-sm font-semibold transition hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
            >
              {tx("Your trips")}
            </Link>
            {isSignedIn ? (
              <Link
                href="/logout"
                className="inline-flex h-11 items-center rounded-[8px] border border-black/15 px-4 text-sm font-semibold transition hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
              >
                {tx("Log out")}
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-[8px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
              >
                {tx("Log in")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <DemoSessionBanner />

      {/* Full-width workspace */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AccountSubnav variant="mobile-bar" />

        {!isSignedIn ? (
          <p className="mt-4 rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60 lg:mt-6">
            Browsing as guest — book without an account anytime.{" "}
            <Link href="/search" className="font-medium underline underline-offset-4">
              Find a car
            </Link>{" "}
            ·{" "}
            <Link href="/bookings/find" className="font-medium underline underline-offset-4">
              Find booking
            </Link>{" "}
            ·{" "}
            <Link href="/signup" className="font-medium underline underline-offset-4">
              Sign up
            </Link>
          </p>
        ) : null}

        <div className="grid gap-8 py-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:py-10 xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              <AccountSubnav variant="sidebar" />
              <div className="rounded-[10px] border border-black/10 px-4 py-4 dark:border-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40 dark:text-white/40">
                  Support
                </p>
                <p className="mt-2 text-xs leading-relaxed text-black/50 dark:text-white/50">
                  Desk hours Sun–Thu, 09:00–18:00 Tunisia time. Not 24/7.
                </p>
                <ul className="mt-3 space-y-1 text-sm font-medium">
                  <li>
                    <Link
                      href="/help"
                      className="inline-flex min-h-10 items-center gap-2 text-black/70 underline-offset-2 hover:underline dark:text-white/70"
                    >
                      <HelpCircle className="size-4 opacity-60" />
                      Help
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="inline-flex min-h-10 items-center gap-2 text-black/70 underline-offset-2 hover:underline dark:text-white/70"
                    >
                      <Mail className="size-4 opacity-60" />
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0">
            <div className="mb-8 flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                {eyebrow ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
                    {tx(eyebrow)}
                  </p>
                ) : null}
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  {tx(title)}
                </h1>
                {description ? (
                  <p className="mt-2 max-w-2xl text-base leading-relaxed text-black/55 dark:text-white/55">
                    {tx(description)}
                  </p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
              ) : null}
            </div>

            <section className={cn("min-w-0", className)}>{children}</section>

            {/* Mobile support */}
            <aside className="mt-12 pt-8 lg:hidden">
              <div className="rounded-[10px] border border-black/10 px-4 py-4 dark:border-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
                  Support
                </p>
                <p className="mt-2 text-xs leading-relaxed text-black/50 dark:text-white/50">
                  Desk hours Sun–Thu, 09:00–18:00 Tunisia time. Not 24/7.
                </p>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                  <li>
                    <Link
                      href="/help"
                      className="inline-flex items-center gap-2 underline-offset-2 hover:underline"
                    >
                      <HelpCircle className="size-4 text-black/40 dark:text-white/40" />
                      Help
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 underline-offset-2 hover:underline"
                    >
                      <Mail className="size-4 text-black/40 dark:text-white/40" />
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
