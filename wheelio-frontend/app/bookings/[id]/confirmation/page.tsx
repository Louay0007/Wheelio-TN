import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { Check, Mail, MessageCircle, Ticket } from "lucide-react"
import { AddToCalendarMenu } from "@/components/bookings/add-to-calendar-menu"
import { ContractDownloads } from "@/components/checkout/contract-downloads"
import { PageShell } from "@/components/page-shell"
import { getDemoBooking, statusLabel } from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"
import { formatTnd } from "@/lib/search-utils"
import { cn } from "@/lib/utils"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ signed?: string; contractId?: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const booking = getDemoBooking(id)
  return {
    title: booking
      ? `Booking ${booking.reference} | Wheelio`
      : "Confirmation | Wheelio",
  }
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { signed, contractId } = await searchParams
  const booking = getDemoBooking(id)
  if (!booking) {
    return (
      <PageShell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-2xl font-semibold">Booking not found</h1>
          <Link href="/search" className="mt-6 inline-flex text-sm font-semibold underline">
            Find a car
          </Link>
        </main>
      </PageShell>
    )
  }

  const offer = getOfferDetail(booking.offerId)
  const statusText = statusLabel(booking.status)
  const isPendingAgency = booking.status === "requested"
  const isPaymentPending = booking.status === "payment_pending"

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
          Booking received
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          You’re set — here’s your reference
        </h1>

        <div className="mt-8 rounded-[14px] border border-black/15 bg-black/[0.02] px-5 py-6 dark:border-white/15 dark:bg-white/[0.03]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
            Booking reference
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {booking.reference}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={cn("rounded-[6px] border px-2.5 py-1 text-xs font-semibold",
                booking.status === "confirmed"
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/20 dark:border-white/20",
              )}
              role="status"
            >
              Status: {statusText}
            </span>
            {signed === "1" ? (
              <span className="rounded-[6px] border border-black/20 px-2.5 py-1 text-xs font-semibold dark:border-white/20">
                Contract signed electronically
              </span>
            ) : null}
            <span className="text-sm text-black/50 dark:text-white/50">
              {isPendingAgency
                ? `Agency usually replies within ${booking.agencyDeadlineHours ?? 6} hours during desk time.`
                : isPaymentPending
                  ? "Complete payment to lock the car."
                  : "Confirmation email and SMS are on the way (demo)."}
            </span>
          </div>
        </div>

        {offer ? (
          <section className="mt-10 flex gap-4 pb-8 dark:border-white/10">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-[10px]">
              <Image
                src={offer.image}
                alt=""
                fill
                sizes="80px"
                className="object-cover grayscale-[15%]"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                {offer.modelName}
                {offer.orSimilar ? " or similar" : ""}
              </h2>
              <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                {offer.agency.name} · {offer.agency.locationLabel}
              </p>
              <p className="mt-2 text-sm">
                Total {formatTnd(booking.rentalTotalTnd + booking.extrasTotalTnd)} ·
                deposit at pickup {formatTnd(booking.depositAtPickupTnd)}
              </p>
              {booking.amountDueNowTnd > 0 ? (
                <p className="text-sm text-black/55 dark:text-white/55">
                  Paid / due now: {formatTnd(booking.amountDueNowTnd)}
                </p>
              ) : (
                <p className="text-sm text-black/55 dark:text-white/55">
                  Pay rental at the agency desk
                </p>
              )}
            </div>
          </section>
        ) : null}

        <section className="py-8 dark:border-white/10">
          <h2 className="text-lg font-semibold">What to bring</h2>
          <ul className="mt-4 space-y-2.5">
            {(offer?.documents ?? [
              "Passport or national ID",
              "Driving licence",
              "Credit card for deposit",
              "This booking reference",
            ]).map((item) => (
              <li key={item} className="flex gap-2 text-sm text-black/70 dark:text-white/70">
                <Check className="mt-0.5 size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="py-8 dark:border-white/10">
          <h2 className="text-lg font-semibold">Pickup</h2>
          <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
            {offer?.pickupMethodNote ?? "See your voucher for desk instructions."}
          </p>
          <p className="mt-2 text-sm font-medium">
            {booking.pickupLabel} · {booking.pickupLocation}
          </p>
          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            Return {booking.returnLabel}
          </p>
          {isPendingAgency ? (
            <p className="mt-3 rounded-[8px] border border-black/15 px-3 py-2 text-sm dark:border-white/15">
              Waiting for {offer?.agency.name ?? "the agency"} — we’ll email you
              when they accept or suggest a change.
            </p>
          ) : null}
        </section>

        <section className="py-8 dark:border-white/10">
          <ContractDownloads
            bookingId={booking.id}
            contractId={contractId}
            agencyConfirmed={booking.status === "confirmed"}
          />
          {signed === "1" ? (
            <p className="mt-3 text-xs text-black/45 dark:text-white/45">
              Your handwritten signature is embedded in both PDF copies.
            </p>
          ) : null}
        </section>

        <section className="flex flex-col gap-3 py-8 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={`/bookings/${booking.id}`}
            className="inline-flex h-11 items-center justify-center rounded-[8px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Manage booking
          </Link>
          <Link
            href={`/bookings/${booking.id}/voucher`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-black/20 px-5 text-sm font-semibold dark:border-white/20"
          >
            <Ticket className="size-4" />
            Open voucher
          </Link>
          {offer ? (
            <AddToCalendarMenu
              booking={booking}
              offer={offer}
              triggerClassName="h-11 px-5"
            />
          ) : null}
          <Link
            href={`/bookings/${booking.id}/schedule`}
            className="inline-flex h-11 items-center justify-center rounded-[8px] border border-black/20 px-5 text-sm font-semibold dark:border-white/20"
          >
            Trip schedule
          </Link>
          <a
            href={`https://wa.me/21600000000?text=${encodeURIComponent(`Hi Wheelio, booking ${booking.reference}`)}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-black/20 px-5 text-sm font-semibold dark:border-white/20"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
          <a
            href="mailto:support@wheelio.tn"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-black/20 px-5 text-sm font-semibold dark:border-white/20"
          >
            <Mail className="size-4" />
            Email
          </a>
        </section>

        <p className="text-xs text-black/40 dark:text-white/40">
          We’ll send this reference by email and SMS. Guest without an account?{" "}
          <Link href="/bookings/find" className="underline underline-offset-2">
            Find booking
          </Link>
          . Support follows Tunisian desk time — not 24/7.
        </p>
      </main>
    </PageShell>
  )
}
