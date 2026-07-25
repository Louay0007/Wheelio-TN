import Link from "next/link"
import { HelpCircle, Mail, MessageCircle } from "lucide-react"
import type { BookingRecord } from "@/lib/bookings"
import { cn } from "@/lib/utils"

const WHATSAPP_BASE = "https://wa.me/21600000000"

type BookingSupportStripProps = {
  booking: BookingRecord
  className?: string
}

export function BookingSupportStrip({ booking, className }: BookingSupportStripProps) {
  const waText = encodeURIComponent(
    `Hi Wheelio, I need help with booking ${booking.reference}`,
  )

  return (
    <aside
      className={cn("rounded-[8px] border border-black/10 px-4 py-4 dark:border-white/10",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
        Support
      </p>
      <p className="mt-2 text-xs leading-relaxed text-black/50 dark:text-white/50">
        Desk hours Sun–Thu, 09:00–18:00 Tunisia time. Not 24/7 — for same-day pickup,
        call the agency on your voucher first.
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
        <li>
          <a
            href={`${WHATSAPP_BASE}?text=${waText}`}
            className="inline-flex items-center gap-2 underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="size-4 text-black/40 dark:text-white/40" />
            WhatsApp
          </a>
        </li>
        <li>
          <a
            href={`mailto:hello@wheelio.tn?subject=${encodeURIComponent(`Booking ${booking.reference}`)}`}
            className="inline-flex items-center gap-2 underline-offset-2 hover:underline"
          >
            <Mail className="size-4 text-black/40 dark:text-white/40" />
            Email
          </a>
        </li>
        <li>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 underline-offset-2 hover:underline"
          >
            <HelpCircle className="size-4 text-black/40 dark:text-white/40" />
            Help
          </Link>
        </li>
      </ul>
    </aside>
  )
}
