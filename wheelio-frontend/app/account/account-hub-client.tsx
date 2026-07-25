"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Car,
  KeyRound,
  Search,
  Shield,
  SlidersHorizontal,
  User,
  UserPlus,
} from "lucide-react"
import { AccountShell } from "@/components/account/account-shell"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import { ApiClientError } from "@/lib/api/client"
import { useMe, useNotifications } from "@/lib/query/account"

const SHORTCUTS = [
  { href: "/trips", title: "Your trips", icon: Car },
  { href: "/trips/calendar", title: "Trip calendar", icon: CalendarDays },
  { href: "/account/profile", title: "Profile", icon: User },
  { href: "/account/drivers", title: "Saved drivers", icon: UserPlus },
  { href: "/account/notifications", title: "Notifications", icon: Bell },
  { href: "/account/preferences", title: "Preferences", icon: SlidersHorizontal },
  { href: "/account/security", title: "Security", icon: KeyRound },
  { href: "/account/privacy", title: "Privacy", icon: Shield },
  { href: "/bookings/find", title: "Find a booking", icon: Search },
  { href: "/account/claim", title: "Claim a trip", icon: ArrowUpRight },
] as const

export function AccountHubClient() {
  const me = useMe()
  const notifications = useNotifications(3)
  if (me.isPending) return <ApiLoadingState label="Loading your account…" />
  const isSignedIn = !(
    me.isError &&
    me.error instanceof ApiClientError &&
    me.error.status === 401
  )
  if (me.isError && isSignedIn) {
    return <ApiErrorState error={me.error} retry={() => me.refetch()} />
  }

  return (
    <AccountShell
      title="Account home"
      description="Trips, profile, and settings in one place. Guest checkout stays available without signing in."
    >
      {!isSignedIn ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-[7px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-[7px] border border-black/15 px-4 text-sm font-medium dark:border-white/15"
          >
            Sign up
          </Link>
        </div>
      ) : null}

      {me.data ? (
        <div className="mt-8 rounded-[8px] border border-black/10 px-4 py-4 dark:border-white/10">
          <p className="font-semibold">
            Welcome, {me.data.profile.preferredName || me.data.profile.legalName}
          </p>
          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            {me.data.user.email}
          </p>
        </div>
      ) : null}

      <div className="mt-10">
        <Link
          href="/account/notifications"
          className="flex items-center justify-between rounded-[8px] border border-black/10 px-4 py-3 transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
        >
          <span className="font-medium">Notifications</span>
          <span className="text-sm text-black/55 dark:text-white/55">
            {notifications.data?.pages[0]?.page.unreadCount
              ? `${notifications.data.pages[0].page.unreadCount} unread`
              : "View your inbox"}
          </span>
        </Link>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SHORTCUTS.map(({ href, title, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full min-h-14 items-center gap-3 rounded-[10px] border border-black/10 p-4 transition-colors duration-200 hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
            >
              <Icon className="size-5 shrink-0 text-black/45 dark:text-white/45" />
              <span className="font-medium tracking-[-0.02em]">{title}</span>
              <ArrowUpRight className="ml-auto size-4 text-black/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-white/25" />
            </Link>
          </li>
        ))}
      </ul>

      {isSignedIn ? (
        <p className="mt-10 pt-8 dark:border-white/10">
          <Link href="/logout" className="text-sm font-medium underline underline-offset-4">
            Log out
          </Link>
        </p>
      ) : null}
    </AccountShell>
  )
}
