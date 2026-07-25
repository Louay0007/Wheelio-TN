"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Car,
  CreditCard,
  KeyRound,
  Link2,
  Menu,
  Settings2,
  Shield,
  User,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n/locale"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

type NavGroup = {
  title: string
  items: NavItem[]
}

export const ACCOUNT_NAV_GROUPS: NavGroup[] = [
  {
    title: "Account",
    items: [
      { label: "Overview", href: "/account", icon: User },
      { label: "Profile", href: "/account/profile", icon: User },
      { label: "Drivers", href: "/account/drivers", icon: Users },
      { label: "Preferences", href: "/account/preferences", icon: Settings2 },
    ],
  },
  {
    title: "Activity",
    items: [
      { label: "Notifications", href: "/account/notifications", icon: Bell },
      { label: "Payments", href: "/account/payments", icon: CreditCard },
      { label: "Claim booking", href: "/account/claim", icon: Link2 },
    ],
  },
  {
    title: "Safety",
    items: [
      { label: "Security", href: "/account/security", icon: KeyRound },
      { label: "Privacy", href: "/account/privacy", icon: Shield },
    ],
  },
]

export const ACCOUNT_NAV_ITEMS = ACCOUNT_NAV_GROUPS.flatMap((g) => g.items)

function isNavActive(pathname: string, href: string) {
  if (href === "/account") {
    return pathname === "/account" || pathname === "/account/"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AccountNavLinks({
  pathname,
  onNavigate,
  orientation = "vertical",
  className,
}: {
  pathname: string
  onNavigate?: () => void
  orientation?: "vertical" | "horizontal"
  className?: string
}) {
  const vertical = orientation === "vertical"
  const { tx } = useLocale()

  return (
    <nav
      className={cn(vertical ? "space-y-6" : "flex gap-1 overflow-x-auto", className)}
      aria-label={tx("Account")}
    >
      {ACCOUNT_NAV_GROUPS.map((group) => (
        <div key={group.title}>
          {vertical ? (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40 dark:text-white/40">
              {tx(group.title)}
            </p>
          ) : null}
          <ul className={cn(vertical ? "space-y-0.5" : "flex gap-1")}>
            {group.items.map((item) => {
              const active = isNavActive(pathname, item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn("inline-flex min-h-11 w-full items-center gap-2.5 rounded-[8px] px-3 text-sm font-medium tracking-[-0.02em] transition-colors duration-200",
                      vertical ? "justify-start" : "whitespace-nowrap",
                      active
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "text-black/60 hover:bg-black/[0.04] hover:text-black dark:text-white/60 dark:hover:bg-white/[0.06] dark:hover:text-white",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    {tx(item.label)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      {vertical ? (
        <div className="pt-4">
          <Link
            href="/trips"
            onClick={onNavigate}
            className="inline-flex min-h-11 w-full items-center gap-2.5 rounded-[8px] px-3 text-sm font-medium text-black/60 transition-colors hover:bg-black/[0.04] hover:text-black dark:text-white/60 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <Car className="size-4 shrink-0 opacity-80" aria-hidden />
            {tx("Your trips")}
          </Link>
          <Link
            href="/logout"
            onClick={onNavigate}
            className="mt-0.5 inline-flex min-h-11 w-full items-center gap-2.5 rounded-[8px] px-3 text-sm font-medium text-black/55 transition-colors hover:bg-black/[0.04] hover:text-black dark:text-white/55 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            {tx("Log out")}
          </Link>
        </div>
      ) : null}
    </nav>
  )
}

type AccountSubnavProps = {
  className?: string
  /** Desktop sidebar mode — used inside AccountShell grid */
  variant?: "sidebar" | "mobile-bar"
}

export function AccountSubnav({
  className,
  variant = "mobile-bar",
}: AccountSubnavProps) {
  const pathname = usePathname() ?? ""

  if (variant === "sidebar") {
    return (
      <div className={cn("hidden lg:block", className)}>
        <AccountNavLinks pathname={pathname} orientation="vertical" />
      </div>
    )
  }

  return (
    <div
      className={cn("flex items-center justify-between gap-3 py-3 lg:hidden",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        Account center
      </p>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 rounded-[8px] border-black/15 dark:border-white/15"
          >
            <Menu className="size-4" />
            Menu
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[12px]">
          <SheetHeader>
            <SheetTitle className="text-left tracking-[-0.02em]">
              Account menu
            </SheetTitle>
          </SheetHeader>
          <AccountNavLinks
            pathname={pathname}
            orientation="vertical"
            className="mt-4"
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
