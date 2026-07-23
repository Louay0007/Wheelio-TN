import type { Metadata } from "next"
import Link from "next/link"
import { PageHero, PageShell } from "@/components/page-shell"
import { HelpHubClient } from "@/components/help/help-hub"

export const metadata: Metadata = {
  title: "Help centre | Wheelio",
  description:
    "Guides for booking, pickup, deposits, cancellation, and documents when renting a car in Tunisia with Wheelio.",
}

export default function HelpPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Help centre"
        title="Find answers before you travel"
        description="Short articles for common booking and pickup questions. Still stuck? Contact support during desk hours."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <HelpHubClient />
        <p className="mt-12 border-t border-black/10 pt-6 text-sm text-black/55 dark:border-white/10 dark:text-white/55">
          Prefer a quick list? See the{" "}
          <Link href="/faq" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">
            FAQ
          </Link>
          {" · "}
          <Link href="/contact" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">
            Contact support
          </Link>
        </p>
      </div>
    </PageShell>
  )
}
