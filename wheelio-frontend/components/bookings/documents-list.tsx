import Link from "next/link"
import { Download, ExternalLink } from "lucide-react"
import type { BookingRecord } from "@/lib/bookings"
import { cn } from "@/lib/utils"

export type DocumentRowStatus = "Ready" | "Pending"

export type DocumentRow = {
  id: string
  title: string
  status: DocumentRowStatus
  dateLabel: string
  action?: { label: string; href?: string; download?: boolean }
  note?: string
}

function statusClasses(status: DocumentRowStatus) {
  return status === "Ready"
    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
    : "border-black/20 text-black/50 dark:border-white/20 dark:text-white/50"
}

export function DocumentRowItem({ row }: { row: DocumentRow }) {
  return (
    <li className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold tracking-[-0.02em]">{row.title}</p>
          <span
            className={cn("rounded-[6px] border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              statusClasses(row.status),
            )}
          >
            {row.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          {row.dateLabel}
        </p>
        {row.note ? (
          <p className="mt-1 text-xs text-black/45 dark:text-white/45">
            {row.note}
          </p>
        ) : null}
      </div>
      {row.action && row.status === "Ready" ? (
        row.action.href ? (
          <Link
            href={row.action.href}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[8px] border border-black/20 px-4 text-sm font-semibold dark:border-white/20"
          >
            {row.action.download ? (
              <Download className="size-4" />
            ) : (
              <ExternalLink className="size-4" />
            )}
            {row.action.label}
          </Link>
        ) : (
          <span className="text-sm text-black/45 dark:text-white/45">
            {row.action.label}
          </span>
        )
      ) : row.status === "Pending" ? (
        <span className="text-sm text-black/40 dark:text-white/40">
          Not issued yet
        </span>
      ) : null}
    </li>
  )
}

export function buildDocumentRows(
  booking: BookingRecord,
  bookingId: string,
): DocumentRow[] {
  const issued = new Date(booking.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const pickupDate = new Date(booking.pickupAtIso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const returnDate = new Date(booking.returnAtIso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const customerReady = booking.status !== "cancelled"
  const agencyReady = ["confirmed", "active", "completed"].includes(
    booking.status,
  )
  const receiptReady =
    booking.amountDueNowTnd > 0 && booking.status !== "payment_pending"
  const deskReady = ["active", "completed"].includes(booking.status)
  const depositNoteReady = booking.status === "completed"

  return [
    {
      id: "customer-contract",
      title: "Customer contract",
      status: customerReady ? "Ready" : "Pending",
      dateLabel: customerReady ? `Issued ${issued}` : "Awaiting signature",
      action: customerReady
        ? { label: "Download", download: true }
        : undefined,
      note: "PDF generated after e-sign · see buttons below",
    },
    {
      id: "agency-contract",
      title: "Agency contract",
      status: agencyReady ? "Ready" : "Pending",
      dateLabel: agencyReady
        ? `Stamped ${pickupDate}`
        : "Available after agency confirms",
      action: agencyReady
        ? { label: "Download", download: true }
        : undefined,
      note: "Agency copy with desk stamp when confirmed",
    },
    {
      id: "voucher",
      title: "Booking voucher",
      status: agencyReady ? "Ready" : "Pending",
      dateLabel: agencyReady ? `Valid from ${pickupDate}` : "After confirmation",
      action: {
        label: "Open",
        href: `/bookings/${bookingId}/voucher`,
      },
    },
    {
      id: "receipt",
      title: "Payment receipt",
      status: receiptReady ? "Ready" : "Pending",
      dateLabel: receiptReady
        ? `Paid ${issued}`
        : booking.amountDueNowTnd > 0
          ? "After online deposit"
          : "No online payment on this booking",
    },
    {
      id: "invoice",
      title: "Invoice / tax receipt",
      status: "Pending",
      dateLabel: "Issued by agency after rental (demo placeholder)",
    },
    {
      id: "desk-papers",
      title: "Agency desk papers",
      status: deskReady ? "Ready" : "Pending",
      dateLabel: deskReady
        ? `Handover ${pickupDate}`
        : "After vehicle collection",
    },
    {
      id: "deposit-release",
      title: "Deposit release note",
      status: depositNoteReady ? "Ready" : "Pending",
      dateLabel: depositNoteReady
        ? `Return ${returnDate}`
        : "After return inspection",
    },
  ]
}
