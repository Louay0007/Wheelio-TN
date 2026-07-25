"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import {
  Banknote,
  Bell,
  CalendarDays,
  Car,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  ScrollText,
  Settings,
  Shield,
  Users,
  Inbox,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PreviewBanner } from "@/components/preview-banner"
import { useAgencySession } from "@/lib/agency-session"
import { inboxBookings } from "@/lib/agency"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

/** Shared text tones - readable in light and dark */
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
}[] = [
  { href: "/agency", label: "Home", icon: LayoutDashboard, section: "Daily work" },
  { href: "/agency/inbox", label: "New requests", icon: Inbox },
  { href: "/agency/bookings", label: "All bookings", icon: ClipboardList },
  { href: "/agency/calendar", label: "Car calendar", icon: CalendarDays },
  { href: "/agency/fleet", label: "My cars", icon: Car, section: "Your fleet" },
  { href: "/agency/rates", label: "Prices", icon: Banknote },
  { href: "/agency/branches", label: "Desks & branches", icon: MapPin },
  { href: "/agency/policies", label: "Rules", icon: ScrollText },
  { href: "/agency/payouts", label: "Payments to you", icon: Banknote, section: "Money" },
  { href: "/agency/reports", label: "Stats", icon: Shield },
  { href: "/agency/team", label: "Staff", icon: Users, section: "Account" },
  { href: "/agency/settings", label: "Settings", icon: Settings },
  { href: "/agency/help", label: "Help", icon: CircleHelp },
]

const MOBILE_PRIMARY = [
  { href: "/agency", label: "Home", icon: LayoutDashboard },
  { href: "/agency/inbox", label: "Requests", icon: Inbox },
  { href: "/agency/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/agency/fleet", label: "Cars", icon: Car },
  { href: "/agency/settings", label: "More", icon: MoreHorizontal },
]

function isActive(pathname: string, href: string) {
  if (href === "/agency") return pathname === "/agency"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function verificationLabel(v?: string) {
  switch (v) {
    case "live":
      return "Live"
    case "review":
      return "Under review"
    case "draft":
      return "Setup"
    case "paused":
      return "Paused"
    case "suspended":
      return "Suspended"
    default:
      return "-"
  }
}

type AgencyShellProps = {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  requireAuth?: boolean
}

export function AgencyShell({
  title,
  description,
  children,
  actions,
  requireAuth = true,
}: AgencyShellProps) {
  const pathname = usePathname()
  const { tx } = useLocale()
  const { session, workspace, ready, isSignedIn, branchId, setSelectedBranch } =
    useAgencySession()
  const unread =
    workspace?.notifications.filter((n) => !n.read).length ?? 0
  const inboxCount = workspace ? inboxBookings(workspace).length : 0

  if (ready && requireAuth && !isSignedIn) {
    return (
      <div className={cn("flex min-h-dvh flex-col items-center justify-center px-4", pageBg)}>
        <div className={cn("w-full max-w-md rounded-[12px] border p-6 shadow-sm", surface)}>
          <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", mutedSoft)}>
            {tx("Agency portal")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-zinc-50">
            {tx("Please sign in")}
          </h1>
          <p className={cn("mt-2 text-sm leading-relaxed", muted)}>
            {tx("This area is for rental agencies only - not for travellers.")}
          </p>
          <Link
            href={`/agency/login?next=${encodeURIComponent(pathname)}`}
            className="mt-6 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[8px] bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {tx("Sign in")}
          </Link>
          <Link
            href="/partners/join"
            className={cn("mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[8px] border text-sm font-semibold text-zinc-900 dark:text-zinc-100",
              "border-zinc-300 dark:border-zinc-600",
            )}
          >
            {tx("Join as a partner")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-dvh", pageBg)}>
      <PreviewBanner />
      <a
        href="#agency-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[8px] focus:bg-zinc-950 focus:px-3 focus:py-2 focus:text-white dark:focus:bg-zinc-50 dark:focus:text-zinc-950"
      >
        {tx("Skip to main content")}
      </a>

      <div className="border-b border-amber-600/25 bg-amber-100 px-4 py-2.5 text-center text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-950 dark:text-amber-50">
        {tx(
          "Demo mode - practice data only. Your deposit money is never part of Wheelio’s fee.",
        )}
      </div>

      {/* Full-bleed layout: sidebar + content use the whole screen */}
      <div className="flex min-h-[calc(100dvh-2.75rem)] w-full">
        <aside
          className={cn("sticky top-0 hidden h-[calc(100dvh-2.75rem)] w-64 shrink-0 flex-col border-r xl:w-72 lg:flex",
            surface,
          )}
        >
          <div className="px-4 py-4">
            <Link href="/agency" className="block">
              <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", mutedSoft)}>
                Wheelio for agencies
              </p>
              <p className="mt-1 truncate text-base font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
                {workspace?.tradeName ?? "Your agency"}
              </p>
            </Link>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-[6px] border border-zinc-300 px-2 py-0.5 text-[11px] font-semibold text-zinc-800 dark:border-zinc-600 dark:text-zinc-100">
                {verificationLabel(workspace?.verification)}
              </span>
              <span className="rounded-[6px] bg-zinc-950 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
                Fee {workspace?.takeRatePercent ?? 12}%
              </span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Agency menu">
            {SIDEBAR.map((item, i) => {
              const prev = SIDEBAR[i - 1]
              const showSection =
                item.section && item.section !== prev?.section
              const Icon = item.icon
              const active = isActive(pathname, item.href)
              const badge = item.href === "/agency/inbox" ? inboxCount : 0
              return (
                <div key={item.href}>
                  {showSection ? (
                    <p
                      className={cn("mb-1 mt-4 px-2 text-[11px] font-semibold uppercase tracking-[0.12em]",
                        mutedSoft,
                      )}
                    >
                      {tx(item.section!)}
                    </p>
                  ) : null}
                  <Link
                    href={item.href}
                    className={cn("mb-0.5 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm font-medium transition",
                      active
                        ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
                    <span className="flex-1">{tx(item.label)}</span>
                    {badge > 0 ? (
                      <span
                        className={cn("rounded-full px-1.5 text-[11px] font-semibold",
                          active
                            ? "bg-white/25 text-white dark:bg-black/15 dark:text-zinc-950"
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
            <p className="truncate capitalize">{session?.role}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
          <header
            className={cn("sticky top-0 z-30 flex h-14 w-full items-center gap-3 px-4 backdrop-blur sm:px-6 lg:px-8",
              "bg-white/95 dark:bg-zinc-900/95",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50 lg:hidden">
                {workspace?.tradeName}
              </p>
              <p className={cn("hidden text-sm lg:block", muted)}>
                Open during desk hours · Fee {workspace?.takeRatePercent ?? 12}%
              </p>
            </div>
            {workspace && workspace.branches.length > 1 ? (
              <label className="hidden items-center gap-2 text-sm md:flex">
                <span className={mutedSoft}>Desk</span>
                <select
                  className="h-10 max-w-[220px] cursor-pointer rounded-[8px] border border-zinc-300 bg-white px-2 text-sm text-zinc-950 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={branchId}
                  aria-label="Filter by desk"
                  onChange={(e) =>
                    setSelectedBranch(e.target.value as string | "all")
                  }
                >
                  <option value="all">All desks</option>
                  {workspace.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className={cn("hidden text-sm md:block", muted)}>
                {workspace?.branches[0]?.name}
              </p>
            )}
            <ThemeToggle variant="header" />
            <Link
              href="/agency/notifications"
              className="relative inline-flex size-11 cursor-pointer items-center justify-center rounded-[8px] border border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-zinc-950 dark:bg-zinc-50" />
              ) : null}
            </Link>
            <Link
              href="/agency/logout"
              className="hidden h-11 cursor-pointer items-center rounded-[8px] border border-zinc-300 px-3 text-sm font-medium text-zinc-900 sm:inline-flex dark:border-zinc-600 dark:text-zinc-100"
            >
              {tx("Log out")}
            </Link>
          </header>

          <main
            id="agency-main"
            className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10"
          >
            <div className="mb-6 flex w-full flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 max-w-3xl">
                <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-3xl dark:text-zinc-50">
                  {tx(title)}
                </h1>
                {description ? (
                  <p className={cn("mt-2 text-base leading-relaxed", muted)}>
                    {tx(description)}
                  </p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex flex-wrap gap-2">{actions}</div>
              ) : null}
            </div>
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>

      <nav
        className={cn("fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden",
          "bg-white/95 dark:bg-zinc-900/95",
        )}
        aria-label="Agency mobile menu"
      >
        {MOBILE_PRIMARY.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active
                  ? "text-zinc-950 dark:text-zinc-50"
                  : mutedSoft,
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
