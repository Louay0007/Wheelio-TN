"use client"

import { useState } from "react"
import { CalendarPlus, Check, Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BookingRecord } from "@/lib/bookings"
import {
  buildTripIcs,
  downloadIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
  plainTripSummary,
} from "@/lib/calendar-export"
import type { OfferDetail } from "@/lib/offer-detail"
import { cn } from "@/lib/utils"

type AddToCalendarMenuProps = {
  booking: BookingRecord
  offer: OfferDetail
  className?: string
  triggerClassName?: string
}

export function AddToCalendarMenu({
  booking,
  offer,
  className,
  triggerClassName,
}: AddToCalendarMenuProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = plainTripSummary(booking, offer)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const icsName = `${booking.reference.replace(/\s+/g, "-")}-wheelio`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("rounded-[8px] border-black/15 dark:border-white/15", triggerClassName)}
        >
          <CalendarPlus className="size-4" />
          Add to calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("w-56 rounded-[8px]", className)}>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => {
            downloadIcs(icsName, buildTripIcs(booking, offer))
          }}
        >
          <Download className="size-4" />
          Download .ics
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={googleCalendarUrl(booking, offer)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-2"
          >
            <CalendarPlus className="size-4" />
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={outlookCalendarUrl(booking, offer)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-2"
          >
            <CalendarPlus className="size-4" />
            Outlook
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onSelect={() => void handleCopy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy summary"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
