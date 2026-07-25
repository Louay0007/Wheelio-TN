"use client"

import type { ReactNode } from "react"
import { SiteHeader } from "@/components/search/site-header"
import { Footer } from "@/components/footer"
import { PreviewBanner } from "@/components/preview-banner"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

type PageShellProps = {
  children: ReactNode
  className?: string
  /** Extra bottom padding for mobile sticky bars */
  withMobileCtaPad?: boolean
}

export function PageShell({
  children,
  className,
  withMobileCtaPad = false,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-white text-black transition-colors dark:bg-zinc-900 dark:text-white">
      <div className="print:hidden">
        <PreviewBanner />
        <SiteHeader />
      </div>
      <div
        className={cn(
          withMobileCtaPad && "pb-28 lg:pb-0",
          className,
        )}
      >
        {children}
      </div>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  const { tx } = useLocale()

  return (
    <header>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
            {tx(eyebrow)}
          </p>
        ) : null}
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          {tx(title)}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-black/55 dark:text-white/55 sm:text-lg">
            {tx(description)}
          </p>
        ) : null}
      </div>
    </header>
  )
}
