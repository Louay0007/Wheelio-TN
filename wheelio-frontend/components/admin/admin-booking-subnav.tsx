"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { adminMutedSoft } from "@/components/admin/admin-kit"

const TABS = [
  { key: "overview", suffix: "", label: "Overview" },
  { key: "timeline", suffix: "/timeline", label: "Timeline" },
  { key: "money", suffix: "/money", label: "Money" },
  { key: "messages", suffix: "/messages", label: "Messages" },
  { key: "override", suffix: "/override", label: "Override" },
] as const

export function AdminBookingSubnav({
  bookingId,
  active,
}: {
  bookingId: string
  active: (typeof TABS)[number]["key"]
}) {
  return (
    <nav
      className="flex flex-wrap gap-1 pb-2"
      aria-label="Booking sections"
    >
      {TABS.map((tab) => {
        const href = `/admin/bookings/${bookingId}${tab.suffix}`
        const on = active === tab.key
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn("rounded-[8px] px-2.5 py-1.5 text-sm font-medium transition",
              on
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                : cn(adminMutedSoft, "hover:bg-zinc-100 dark:hover:bg-zinc-800"),
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
