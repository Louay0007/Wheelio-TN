import type { ReactNode } from "react"
import { PageShell } from "@/components/page-shell"
import { BookingHeader } from "@/components/bookings/booking-header"
import { BookingNextStep } from "@/components/bookings/booking-next-step"
import { BookingSubnav } from "@/components/bookings/booking-subnav"
import { BookingSupportStrip } from "@/components/bookings/booking-support-strip"
import type { BookingRecord } from "@/lib/bookings"
import type { OfferDetail } from "@/lib/offer-detail"
import { cn } from "@/lib/utils"

type BookingShellProps = {
  booking: BookingRecord
  offer: OfferDetail
  children: ReactNode
  headerEyebrow?: string
  headerActions?: ReactNode
  showNextStep?: boolean
  showSupport?: boolean
  showSubnav?: boolean
  className?: string
  mainClassName?: string
}

export function BookingShell({
  booking,
  offer,
  children,
  headerEyebrow,
  headerActions,
  showNextStep = true,
  showSupport = true,
  showSubnav = true,
  className,
  mainClassName,
}: BookingShellProps) {
  return (
    <PageShell className={className}>
      <main
        className={cn("mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12",
          mainClassName,
        )}
      >
        <BookingHeader
          booking={booking}
          offer={offer}
          eyebrow={headerEyebrow}
          className="print:hidden"
        >
          {headerActions}
        </BookingHeader>

        {showSubnav ? (
          <div className="mt-6 print:hidden">
            <BookingSubnav bookingId={booking.id} />
          </div>
        ) : null}

        {showNextStep ? (
          <div className="mt-6 print:hidden">
            <BookingNextStep booking={booking} />
          </div>
        ) : null}

        <div className="mt-8 print:mt-0">{children}</div>

        {showSupport ? (
          <div className="mt-10 print:hidden">
            <BookingSupportStrip booking={booking} />
          </div>
        ) : null}
      </main>
    </PageShell>
  )
}
