import type { OfferDetail } from "@/lib/offer-detail"
import type { TripQuery } from "@/lib/search-types"
import { formatTnd, formatTripDate, rentalDays } from "@/lib/search-utils"

type RentalContractProps = {
  offer: OfferDetail
  trip: TripQuery
  driverName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  grandTotalTnd: number
  depositTnd: number
  paymentLabel: string
  signedAt?: string | null
  signatureDataUrl?: string | null
}

export function RentalContractDocument({
  offer,
  trip,
  driverName,
  contactName,
  contactEmail,
  contactPhone,
  grandTotalTnd,
  depositTnd,
  paymentLabel,
  signedAt,
  signatureDataUrl,
}: RentalContractProps) {
  const days = rentalDays(trip.pickupDate, trip.dropoffDate)
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <article className="rounded-[12px] border border-black/15 bg-white text-black shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:border-white/15 dark:bg-zinc-950 dark:text-white dark:shadow-none">
      <div className="border-b border-black/10 px-5 py-4 dark:border-white/10 sm:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
          Wheelio TN · Rental booking agreement
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
          Customer contract (preview)
        </h2>
        <p className="mt-1 text-xs text-black/45 dark:text-white/45">
          Document date {today} · Marketplace intermediary agreement
        </p>
      </div>

      <div className="max-h-[min(52vh,420px)] space-y-5 overflow-y-auto px-5 py-5 text-sm leading-relaxed text-black/75 dark:text-white/75 sm:px-7">
        <section>
          <h3 className="font-semibold text-black dark:text-white">1. Parties</h3>
          <p className="mt-2">
            This booking is arranged by <strong>Wheelio TN</strong> (marketplace)
            between the customer and the local rental agency{" "}
            <strong>{offer.agency.name}</strong> ({offer.agency.city}). Wheelio
            does not own the vehicle fleet. The agency issues the rental
            contract and holds the security deposit at pickup.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-black dark:text-white">
            2. Customer & driver
          </h3>
          <ul className="mt-2 space-y-1">
            <li>Contact name: {contactName || "—"}</li>
            <li>Email: {contactEmail || "—"}</li>
            <li>Phone: {contactPhone || "—"}</li>
            <li>Main driver (as on licence): {driverName || "—"}</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-black dark:text-white">
            3. Vehicle & trip
          </h3>
          <ul className="mt-2 space-y-1">
            <li>
              Vehicle: {offer.modelName}
              {offer.orSimilar ? " or similar" : ""} ({offer.categoryLabel})
            </li>
            <li>
              Pickup: {trip.pickupLocation} · {formatTripDate(trip.pickupDate)}{" "}
              {trip.pickupTime}
            </li>
            <li>
              Return:{" "}
              {trip.differentReturn ? trip.dropoffLocation : trip.pickupLocation}{" "}
              · {formatTripDate(trip.dropoffDate)} {trip.dropoffTime}
            </li>
            <li>
              Duration: {days} day{days === 1 ? "" : "s"}
            </li>
            <li>Handover: {offer.pickupMethodNote}</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-black dark:text-white">
            4. Price (TND)
          </h3>
          <ul className="mt-2 space-y-1">
            <li>
              Mandatory trip total: <strong>{formatTnd(grandTotalTnd)}</strong>
            </li>
            <li>
              Refundable security deposit at pickup (separate):{" "}
              <strong>{formatTnd(depositTnd)}</strong>
            </li>
            <li>Payment choice: {paymentLabel}</li>
            <li>Cancellation: {offer.cancellationNote}</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-black dark:text-white">
            5. Customer declarations
          </h3>
          <p className="mt-2">
            By signing, I confirm that: (a) the main driver meets the agency’s
            minimum age and licence rules; (b) I will present passport/ID,
            driving licence, and a card for the deposit at pickup; (c) I have
            read the cancellation summary and marketplace terms; (d) I
            understand mileage/fuel and protection exclusions as shown on the
            offer; (e) electronic signature below has the same intent as a
            handwritten signature for this booking request.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-black dark:text-white">
            6. Agency confirmation
          </h3>
          <p className="mt-2">
            {offer.confirmation === "instant"
              ? "This offer supports instant confirmation subject to successful payment choice and agency availability at pickup."
              : "This is a request-to-book. The agency may accept, propose a change, or decline within desk hours. No rental charge applies until accepted under the stated cancellation rules."}
          </p>
        </section>

        {(signatureDataUrl || signedAt) && (
          <section className="rounded-[8px] border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">
              Signed copy
            </p>
            {signatureDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signatureDataUrl}
                alt="Customer signature"
                className="mt-2 h-16 w-auto max-w-full object-contain"
              />
            ) : null}
            {signedAt ? (
              <p className="mt-2 text-xs text-black/50 dark:text-white/50">
                Signed electronically on {signedAt}
              </p>
            ) : null}
          </section>
        )}
      </div>
    </article>
  )
}
