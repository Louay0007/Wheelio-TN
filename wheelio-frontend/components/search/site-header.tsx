"use client"

import Image from "next/image"
import Link from "next/link"
import { AccountMenu } from "@/components/account/account-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLocale } from "@/lib/i18n/locale"

export function SiteHeader() {
  const { t } = useLocale()

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md transition-colors dark:bg-zinc-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-black dark:text-white"
          aria-label="Wheelio home"
        >
          <Image
            src="/logos/wheelio-icon.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-[10px]"
            priority
          />
          <span className="text-lg font-semibold tracking-[-0.03em]">Wheelio</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-black/60 dark:text-white/60 md:flex">
          <Link
            href="/how-it-works"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            {t("nav.howItWorks")}
          </Link>
          <Link
            href="/locations"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            {t("nav.locations")}
          </Link>
          <Link
            href="/trips"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            {t("nav.trips")}
          </Link>
          <Link
            href="/help"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            {t("nav.help")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle variant="header" />
          <AccountMenu />
          <Link
            href="/search"
            className="hidden rounded-[7px] bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 sm:inline-flex"
          >
            {t("nav.findCar")}
          </Link>
        </div>
      </div>
    </header>
  )
}
