import type { Metadata } from "next"
import { BookingShell } from "@/components/bookings/booking-shell"
import {
  buildDocumentRows,
  DocumentRowItem,
} from "@/components/bookings/documents-list"
import { ContractDownloads } from "@/components/checkout/contract-downloads"
import { PageShell } from "@/components/page-shell"
import Link from "next/link"
import { getDemoBooking } from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const booking = getDemoBooking(id)
  return {
    title: booking
      ? `Documents · ${booking.reference} | Wheelio`
      : "Documents | Wheelio",
  }
}

export default async function BookingDocumentsPage({ params }: PageProps) {
  const { id } = await params
  const booking = getDemoBooking(id)
  const offer = booking ? getOfferDetail(booking.offerId) : null

  if (!booking || !offer) {
    return (
      <PageShell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-2xl font-semibold">Booking not found</h1>
          <Link
            href="/search"
            className="mt-6 inline-flex text-sm font-semibold underline"
          >
            Find a car
          </Link>
        </main>
      </PageShell>
    )
  }

  const rows = buildDocumentRows(booking, booking.id)
  const agencyConfirmed = ["confirmed", "active", "completed"].includes(
    booking.status,
  )

  return (
    <BookingShell
      booking={booking}
      offer={offer}
      headerEyebrow="Documents"
      showNextStep={false}
    >
      <section>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">
          Trip file shelf
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-black/55 dark:text-white/55">
          Contracts, voucher, receipts, and desk paperwork for{" "}
          {booking.reference}. Deposit release is listed separately from rental
          invoices.
        </p>

        <ul className="mt-6">
          {rows.map((row) => (
            <DocumentRowItem key={row.id} row={row} />
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-[12px] border border-black/10 p-5 dark:border-white/10">
        <ContractDownloads
          bookingId={booking.id}
          agencyConfirmed={agencyConfirmed}
        />
        <p className="mt-4 text-xs leading-relaxed text-black/45 dark:text-white/45">
          Signed contracts include a short SHA-256 integrity fingerprint (demo:{" "}
          <span className="font-mono">e7b4c9a1…8f2d</span>). Do not alter PDF
          contents after signing — agencies may refuse pickup if hashes do not
          match verification.
        </p>
      </section>
    </BookingShell>
  )
}
