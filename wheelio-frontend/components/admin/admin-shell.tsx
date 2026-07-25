"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import {
  Banknote,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  Flag,
  Inbox,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  Search,
  Settings,
  Shield,
  Users,
  Car,
  BarChart3,
  Scale,
  MessageSquareWarning,
  Timer,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAdminSession } from "@/lib/admin-session"
import { queueCounts, roleLabel } from "@/lib/admin"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

const muted = "text-zinc-600 dark:text-zinc-300"
const mutedSoft = "text-zinc-500 dark:text-zinc-400"
const surface =
  "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
const pageBg = "bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50"

const SIDEBAR: {
  href: string
  label: string
  icon: typeof LayoutDashboard
  section?: string
  badgeKey?: keyof ReturnType<typeof queueCounts>
}[] = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, section: "Ops" },
  {
    href: "/admin/applications",
    label: "Applications",
    icon: Inbox,
    badgeKey: "applications",
  },
  { href: "/admin/agencies", label: "Agencies", icon: Building2 },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: ClipboardList,
    section: "Support",
  },
  {
    href: "/admin/cases",
    label: "Cases",
    icon: MessageSquareWarning,
    badgeKey: "cases",
  },
  {
    href: "/admin/claims",
    label: "Claims",
    icon: Scale,
    badgeKey: "claims",
  },
  { href: "/admin/sla", label: "SLA", icon: Timer, badgeKey: "sla" },
  {
    href: "/admin/finance",
    label: "Finance",
    icon: Banknote,
    section: "Money",
    badgeKey: "payouts",
  },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car, section: "Supply" },
  { href: "/admin/categories", label: "Categories", icon: Flag },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  {
    href: "/admin/content",
    label: "Content",
    icon: FileText,
    section: "Growth",
  },
  {
    href: "/admin/content/reviews",
    label: "Reviews",
    icon: Shield,
    badgeKey: "reviews",
  },
  { href: "/admin/promotions", label: "Promotions", icon: Flag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
    section: "Platform",
  },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/audit", label: "Audit", icon: Shield },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

const MOBILE = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Queues", icon: Inbox },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/finance", label: "Finance", icon: Banknote },
  { href: "/admin/settings", label: "More", icon: MoreHorizontal },
]

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

type AdminShellProps = {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  requireAuth?: boolean
}

export function AdminShell({
  title,
  description,
  children,
  actions,
  requireAuth = true,
}: AdminShellProps) {
  const pathname = usePathname()
  const { tx } = useLocale()
  const { session, workspace, ready, isSignedIn, needsMfa } = useAdminSession()
  const counts = workspace ? queueCounts(workspace) : null
  const unread = workspace?.notifications.filter((n) => !n.read).length ?? 0

  if (ready && requireAuth && !isSignedIn) {
    return (
      <div className={cn("flex min-h-dvh flex-col items-center justify-center px-4", pageBg)}>
        <div className={cn("w-full max-w-md rounded-[10px] border p-6", surface)}>
          <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", mutedSoft)}>
            Wheelio staff
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Please sign in</h1>
          <p className={cn("mt-2 text-sm", muted)}>
            This area is for Wheelio employees only.
          </p>
          <Link
            href={`/admin/login?next=${encodeURIComponent(pathname)}`}
            className="mt-6 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[8px] bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (ready && requireAuth && needsMfa && !pathname.startsWith("/admin/mfa")) {
    return (
      <div className={cn("flex min-h-dvh flex-col items-center justify-center px-4", pageBg)}>
        <div className={cn("w-full max-w-md rounded-[10px] border p-6", surface)}>
          <h1 className="text-2xl font-semibold">Confirm MFA</h1>
          <p className={cn("mt-2 text-sm", muted)}>
            Finance and super roles need a second step before continuing.
          </p>
          <Link
            href={`/admin/mfa?next=${encodeURIComponent(pathname)}`}
            className="mt-6 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[8px] bg-zinc-950 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
          >
            Enter MFA code
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-dvh", pageBg)}>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[8px] focus:bg-zinc-950 focus:px-3 focus:py-2 focus:text-white dark:focus:bg-zinc-50 dark:focus:text-zinc-950"
      >
        Skip to main content
      </a>

      <div className="border-b border-amber-600/25 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-950 dark:text-amber-50">
        Admin preview - demo data, not live money. Deposit is never part of Wheelio fee.
      </div>

      <div className="flex min-h-[calc(100dvh-2.5rem)] w-full">
        <aside
          className={cn("sticky top-0 hidden h-[calc(100dvh-2.5rem)] w-60 shrink-0 flex-col border-r xl:w-64 lg:flex",
            surface,
          )}
        >
          <div className="px-3 py-3">
            <Link href="/admin" className="block">
              <p className={cn("text-[11px] font-semibold uppercase tracking-[0.14em]", mutedSoft)}>
                Wheelio admin
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold">Marketplace control</p>
            </Link>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="rounded-[6px] bg-zinc-950 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
                Demo
              </span>
              <span className="rounded-[6px] border border-zinc-300 px-1.5 py-0.5 text-[10px] font-semibold dark:border-zinc-600">
                Fee {workspace?.takeRateStandard ?? 12}%
              </span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Admin menu">
            {SIDEBAR.map((item, i) => {
              const prev = SIDEBAR[i - 1]
              const showSection = item.section && item.section !== prev?.section
              const Icon = item.icon
              const active = isActive(pathname, item.href)
              const badge =
                item.badgeKey && counts ? counts[item.badgeKey] : 0
              return (
                <div key={item.href}>
                  {showSection ? (
                    <p
                      className={cn("mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-[0.12em]",
                        mutedSoft,
                      )}
                    >
                      {tx(item.section!)}
                    </p>
                  ) : null}
                  <Link
                    href={item.href}
                    className={cn("mb-0.5 flex min-h-10 cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-sm font-medium transition",
                      active
                        ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
                    <span className="flex-1 truncate">{tx(item.label)}</span>
                    {badge > 0 ? (
                      <span
                        className={cn("rounded-full px-1.5 text-[10px] font-semibold",
                          active
                            ? "bg-white/25 dark:bg-black/15"
                            : "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950",
                        )}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                </div>
              )
            })}
          </nav>
          <div className={cn("p-3 text-sm", muted)}>
            <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
              {session?.name}
            </p>
            <p className="truncate">{session ? roleLabel(session.role) : ""}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
          <header
            className={cn("sticky top-0 z-30 flex h-12 w-full items-center gap-2 px-3 backdrop-blur sm:px-5",
              "bg-white/95 dark:bg-zinc-900/95",
            )}
          >
            <p className="truncate text-sm font-semibold lg:hidden">
              {workspace ? "Wheelio admin" : "Admin"}
            </p>
            <form
              action="/admin/search"
              className="ml-auto hidden min-w-0 flex-1 md:block md:max-w-md"
            >
              <label className="relative block">
                <span className="sr-only">Global search</span>
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                  aria-hidden
                />
                <input
                  name="q"
                  placeholder="WTN-… · phone · agency · plate"
                  className="h-9 w-full rounded-[8px] border border-zinc-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-950 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
              </label>
            </form>
            <Link
              href="/admin/search"
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[8px] border border-zinc-300 md:hidden dark:border-zinc-600"
              aria-label="Search"
            >
              <Search className="size-4" />
            </Link>
            <ThemeToggle variant="header" />
            <Link
              href="/admin/notifications"
              className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-[8px] border border-zinc-300 dark:border-zinc-600"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-zinc-950 dark:bg-zinc-50" />
              ) : null}
            </Link>
            <Link
              href="/admin/logout"
              className="hidden h-10 cursor-pointer items-center rounded-[8px] border border-zinc-300 px-3 text-sm font-medium sm:inline-flex dark:border-zinc-600"
            >
              {tx("Log out")}
            </Link>
          </header>

          <main id="admin-main" className="w-full flex-1 px-3 py-5 sm:px-5 lg:px-6">
            <div className="mb-5 flex w-full flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 max-w-3xl">
                <h1 className="text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                  {tx(title)}
                </h1>
                {description ? (
                  <p className={cn("mt-1.5 text-sm leading-relaxed", muted)}>{tx(description)}</p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>

      <nav
        className={cn("fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden",
          "bg-white/95 dark:bg-zinc-900/95",
        )}
        aria-label="Admin mobile menu"
      >
        {MOBILE.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-zinc-950 dark:text-zinc-50" : mutedSoft,
              )}
            >
              <Icon className="size-5" aria-hidden />
              {tx(item.label)}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
