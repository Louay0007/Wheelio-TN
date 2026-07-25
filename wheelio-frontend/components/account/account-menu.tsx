"use client"

import Link from "next/link"
import { ChevronDown, LogOut, Search, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/account/user-avatar"
import { useDemoSession } from "@/lib/use-demo-session"
import { listDemoNotifications } from "@/lib/notification-feed"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

type AccountMenuProps = {
  unreadNotifications?: number
}

export function AccountMenu({ unreadNotifications }: AccountMenuProps) {
  const { user, isSignedIn, ready } = useDemoSession()
  const { tx } = useLocale()

  const unread =
    unreadNotifications ??
    (isSignedIn ? listDemoNotifications().filter((n) => n.actionNeeded).length : 0)

  const triggerLabel =
    isSignedIn && user ? userInitialsOrName(user) : tx("Account")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn("inline-flex items-center gap-2 rounded-[8px] border border-black/15 px-2.5 py-1.5 text-sm font-medium text-black transition-colors hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:border-white/15 dark:text-white dark:hover:bg-white/[0.06] dark:focus-visible:outline-white",
        )}
        aria-label={tx("Account")}
      >
        {isSignedIn && user ? (
          <UserAvatar user={user} size="sm" />
        ) : (
          <User className="size-4 text-black/50 dark:text-white/50" aria-hidden />
        )}
        <span className="hidden max-w-[8rem] truncate sm:inline">{triggerLabel}</span>
        <ChevronDown className="size-4 text-black/40 dark:text-white/40" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem] rounded-[8px]">
        {!ready ? (
          <DropdownMenuLabel className="font-normal text-black/50 dark:text-white/50">
            {tx("Loading…")}
          </DropdownMenuLabel>
        ) : isSignedIn && user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <span className="block font-semibold tracking-[-0.02em]">
                {user.preferredName || user.name}
              </span>
              <span className="text-xs font-normal text-black/50 dark:text-white/50">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">{tx("Account")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/trips">{tx("Trips")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/profile">{tx("Profile")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/notifications" className="flex w-full items-center justify-between">
                {tx("Notifications")}
                {unread > 0 ? (
                  <span className="size-2 rounded-full bg-black dark:bg-white" aria-label={`${unread} unread`} />
                ) : null}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/logout" className="text-black dark:text-white">
                <LogOut className="size-4" />
                {tx("Log out")}
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal text-black/55 dark:text-white/55">
              {tx("Book as guest anytime")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/login">{tx("Log in")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/signup">{tx("Sign up")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/bookings/find">
                <Search className="size-4" />
                {tx("Find a booking")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/trips">{tx("Trips")}</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function userInitialsOrName(user: { name: string; preferredName?: string }) {
  const name = user.preferredName || user.name
  const first = name.split(/\s+/)[0]
  return first || "Account"
}
