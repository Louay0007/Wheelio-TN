import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Account | Wheelio TN",
  description:
    "Manage demo bookings on Wheelio TN. Account features are preview UI — authentication is not live.",
}

const DEMO_BOOKINGS = [
  {
    id: "bk-tn-cmp-208-02",
    label: "Peugeot 208 · Carthage Drive",
    status: "Upcoming",
    statusTone: "confirmed" as const,
    when: "Pickup 28 Jul 2026 · Tunis-Carthage",
    href: "/bookings/bk-tn-cmp-208-02",
    confirmHref: "/bookings/bk-tn-cmp-208-02/confirmation",
  },
  {
    id: "bk-tn-eco-clio-01",
    label: "Renault Clio · Medina Cars Tunis",
    status: "Past",
    statusTone: "completed" as const,
    when: "Completed · Jun 2026",
    href: "/bookings/bk-tn-eco-clio-01",
    confirmHref: "/bookings/bk-tn-eco-clio-01/confirmation",
  },
]

export default function AccountPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Account"
        title="Your bookings"
        description="Demo account view — authentication is not live. These sample bookings illustrate manage and confirmation links."
      />

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
          Guest checkout stays available without an account.{" "}
          <Link href="/search" className="font-medium underline underline-offset-4">
            Find a car
          </Link>
        </p>

        <h2 className="mt-10 text-lg font-semibold tracking-[-0.02em]">Bookings</h2>
        <ul className="mt-4 space-y-3">
          {DEMO_BOOKINGS.map((b) => (
            <li
              key={b.id}
              className="rounded-[8px] border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold tracking-[-0.02em]">{b.label}</p>
                  <p className="mt-1 text-sm text-black/50 dark:text-white/50">{b.when}</p>
                  <p className="mt-1 font-mono text-xs text-black/40 dark:text-white/40">
                    {b.id}
                  </p>
                </div>
                <span
                  className={`rounded-[6px] px-2.5 py-1 text-xs font-semibold ${
                    b.statusTone === "confirmed"
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "border border-black/15 text-black/60 dark:border-white/15 dark:text-white/60"
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={b.href}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-black px-3 text-xs font-semibold text-white dark:bg-white dark:text-black"
                >
                  Manage booking
                  <ArrowUpRight className="size-3.5" />
                </Link>
                <Link
                  href={b.confirmHref}
                  className="inline-flex h-9 items-center rounded-[6px] border border-black/15 px-3 text-xs font-semibold dark:border-white/15"
                >
                  Confirmation
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 space-y-2 border-t border-black/10 pt-8 text-sm dark:border-white/10">
          <p className="font-medium">Profile (demo)</p>
          <p className="text-black/55 dark:text-white/55">
            Name, email, phone, and language preferences will appear here when auth ships.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/login" className="underline underline-offset-4">
              Log in
            </Link>
            <Link href="/signup" className="underline underline-offset-4">
              Sign up
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
