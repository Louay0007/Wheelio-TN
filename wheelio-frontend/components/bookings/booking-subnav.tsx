"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
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

export type BookingSubnavItem = {
  label: string
  segment: string
}

const DEFAULT_ITEMS: BookingSubnavItem[] = [
  { label: "Overview", segment: "" },
  { label: "Schedule", segment: "/schedule" },
  { label: "Voucher", segment: "/voucher" },
  { label: "Documents", segment: "/documents" },
  { label: "Payments", segment: "/payments" },
  { label: "Messages", segment: "/messages" },
  { label: "Pickup", segment: "/pickup" },
]

type BookingSubnavProps = {
  bookingId: string
  items?: BookingSubnavItem[]
  className?: string
}

function hrefFor(bookingId: string, segment: string) {
  const base = `/bookings/${bookingId}`
  if (!segment) return base
  return `${base}${segment}`
}

function isActive(pathname: string, bookingId: string, segment: string) {
  const href = hrefFor(bookingId, segment)
  if (!segment) {
    return pathname === href || pathname === `${href}/`
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({
  bookingId,
  items,
  pathname,
  onNavigate,
  className,
}: {
  bookingId: string
  items: BookingSubnavItem[]
  pathname: string
  onNavigate?: () => void
  className?: string
}) {
  const { tx } = useLocale()
  return (
    <nav className={cn("flex gap-1", className)} aria-label={tx("Trips")}>
      {items.map((item) => {
        const active = isActive(pathname, bookingId, item.segment)
        const href = hrefFor(bookingId, item.segment)
        return (
          <Link
            key={item.segment || "overview"}
            href={href}
            onClick={onNavigate}
            className={cn("whitespace-nowrap rounded-[8px] px-3 py-2 text-sm font-medium tracking-[-0.02em] transition-colors",
              active
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-black/55 hover:bg-black/[0.04] hover:text-black dark:text-white/55 dark:hover:bg-white/[0.06] dark:hover:text-white",
            )}
          >
            {tx(item.label)}
          </Link>
        )
      })}
    </nav>
  )
}

export function BookingSubnav({
  bookingId,
  items = DEFAULT_ITEMS,
  className,
}: BookingSubnavProps) {
  const pathname = usePathname() ?? ""
  const { tx } = useLocale()

  return (
    <div className={cn(className)}>
      <div className="hidden md:block">
        <NavLinks
          bookingId={bookingId}
          items={items}
          pathname={pathname}
          className="-mb-px overflow-x-auto pb-px"
        />
      </div>

      <div className="flex items-center justify-between gap-3 py-2 md:hidden">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
          {tx("Trips")}
        </p>
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="rounded-[8px]">
              <Menu className="size-4" />
              {tx("Overview")}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[12px]">
            <SheetHeader>
              <SheetTitle className="text-left tracking-[-0.02em]">
                {tx("Trips")}
              </SheetTitle>
            </SheetHeader>
            <NavLinks
              bookingId={bookingId}
              items={items}
              pathname={pathname}
              className="mt-4 flex-col"
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
