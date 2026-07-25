"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Briefcase,
  Check,
  Cog,
  Fuel,
  MapPin,
  Snowflake,
  Star,
  Users,
  X,
} from "lucide-react"
import { Footer } from "@/components/footer"
import { BookingRail } from "@/components/offer/booking-rail"
import { OfferGallery } from "@/components/offer/offer-gallery"
import { SiteHeader } from "@/components/search/site-header"
import {
  getOfferPriceLines,
  type OfferDetail,
} from "@/lib/offer-detail"
import {
  formatTnd,
  formatTripDate,
  parseTripQuery,
  rentalDays,
} from "@/lib/search-utils"
import { cn } from "@/lib/utils"

type OfferDetailViewProps = {
  offer: OfferDetail
}

function SpecChip({
  icon,
  label,
}: {
  icon: ReactNode
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[7px] border border-black/12 bg-black/[0.02] px-3 py-1.5 text-sm text-black/75 dark:border-white/12 dark:bg-white/[0.03] dark:text-white/75">
      <span className="text-black/40 dark:text-white/40">{icon}</span>
      {label}
    </span>
  )
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 py-10"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/40 dark:text-white/40">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-black dark:text-white">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function fallbackTripDates() {
  const pickup = new Date()
  pickup.setDate(pickup.getDate() + 1)
  const dropoff = new Date(pickup)
  dropoff.setDate(dropoff.getDate() + 6)
  const toDate = (d: Date) => d.toISOString().slice(0, 10)
  return {
    pickupLocation: "Tunis-Carthage Airport",
    dropoffLocation: "Tunis-Carthage Airport",
    pickupDate: toDate(pickup),
    pickupTime: "10:00",
    dropoffDate: toDate(dropoff),
    dropoffTime: "10:00",
    driverAge: "30",
    differentReturn: false,
  }
}

export function OfferDetailView({ offer }: OfferDetailViewProps) {
  const searchParams = useSearchParams()
  const trip = useMemo(
    () => parseTripQuery(searchParams, fallbackTripDates()),
    [searchParams],
  )
  const days = rentalDays(trip.pickupDate, trip.dropoffDate)
  const perDay = Math.round(offer.totalPriceTnd / days)
  const priceLines = useMemo(
    () => getOfferPriceLines(offer, days),
    [offer, days],
  )

  const checkoutHref = `/checkout?offerId=${encodeURIComponent(offer.id)}&${searchParams.toString()}`
  const backHref = searchParams.toString()
    ? `/search?${searchParams.toString()}`
    : "/search"

  const transmissionLabel =
    offer.transmission === "automatic" ? "Automatic" : "Manual"
  const fuelLabel = offer.fuel.charAt(0).toUpperCase() + offer.fuel.slice(1)
  const pickupLabel =
    offer.pickupMethod === "meet_greet"
      ? "Meet & greet"
      : offer.pickupMethod === "delivery"
        ? "Delivery"
        : "Counter"

  return (
    <div className="min-h-screen bg-white text-black transition-colors dark:bg-zinc-900 dark:text-white">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-16 lg:pt-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 font-medium text-black/60 transition hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to results
          </Link>
          <span className="text-black/25 dark:text-white/25">/</span>
          <span className="text-black/45 dark:text-white/45">
            {offer.categoryLabel} · {offer.agency.city}
          </span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <OfferGallery
              images={offer.gallery}
              alt={`${offer.modelName} rental photos`}
            />

            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-[6px] border border-black/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-black/70 dark:border-white/15 dark:text-white/70">
                  {offer.categoryLabel}
                </span>
                {offer.orSimilar && (
                  <span className="text-sm text-black/45 dark:text-white/45">
                    or similar model
                  </span>
                )}
                <span
                  className={cn("rounded-[6px] px-2.5 py-1 text-[11px] font-semibold",
                    offer.confirmation === "instant"
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "border border-black/20 dark:border-white/20",
                  )}
                >
                  {offer.confirmation === "instant"
                    ? "Instant confirmation"
                    : "Request to book"}
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                {offer.modelName}
                {offer.orSimilar && (
                  <span className="font-normal text-black/40 dark:text-white/40">
                    {" "}
                    or similar
                  </span>
                )}
              </h1>

              <p className="mt-2 text-sm text-black/50 dark:text-white/50">
                {formatTripDate(trip.pickupDate)} {trip.pickupTime} →{" "}
                {formatTripDate(trip.dropoffDate)} {trip.dropoffTime} ·{" "}
                {days} day{days === 1 ? "" : "s"} · pickup at{" "}
                {trip.pickupLocation}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <SpecChip
                  icon={<Users className="size-3.5" />}
                  label={`${offer.seats} seats`}
                />
                <SpecChip
                  icon={<Briefcase className="size-3.5" />}
                  label={`${offer.bags} bags`}
                />
                <SpecChip
                  icon={<Cog className="size-3.5" />}
                  label={transmissionLabel}
                />
                <SpecChip
                  icon={<Fuel className="size-3.5" />}
                  label={fuelLabel}
                />
                {offer.airConditioning && (
                  <SpecChip
                    icon={<Snowflake className="size-3.5" />}
                    label="A/C"
                  />
                )}
                <SpecChip
                  icon={<MapPin className="size-3.5" />}
                  label={pickupLabel}
                />
              </div>
            </div>

            {offer.notices.length > 0 && (
              <div className="mt-8 space-y-3">
                {offer.notices.map((notice) => (
                  <div
                    key={notice.id}
                    className={cn("rounded-[10px] border px-4 py-3",
                      notice.severity === "warn"
                        ? "border-black/25 bg-black/[0.03] dark:border-white/25 dark:bg-white/[0.04]"
                        : "border-black/10",
                    )}
                  >
                    <p className="text-sm font-semibold">{notice.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-black/55 dark:text-white/55">
                      {notice.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Section
              id="included"
              eyebrow="Deal"
              title="What’s included"
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                {offer.included.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-black/80 dark:text-white/80"
                  >
                    <Check className="mt-0.5 size-4 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
                {offer.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-black/80 dark:text-white/80"
                  >
                    <Check className="mt-0.5 size-4 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-sm text-black/80 dark:text-white/80">
                  <Check className="mt-0.5 size-4 shrink-0" />
                  <span>{offer.mileageNote}</span>
                </li>
              </ul>
            </Section>

            <Section
              id="price"
              eyebrow="Transparency"
              title="Price breakdown"
            >
              <p className="mb-5 max-w-xl text-sm leading-relaxed text-black/55 dark:text-white/55">
                Everything in this total is mandatory for this trip. The security
                deposit is held separately at pickup and is not added here.
              </p>
              <div className="overflow-hidden rounded-[12px] border border-black/10">
                <table className="w-full text-sm">
                  <tbody>
                    {priceLines.map((line) => {
                      const isTotal = line.kind === "total"
                      const isCredit = line.kind === "credit"
                      return (
                        <tr
                          key={line.label}
                          className={cn("border-b border-black/8 dark:border-white/8",
                            isTotal && "bg-black/[0.03] dark:bg-white/[0.04]",
                          )}
                        >
                          <td className="px-4 py-3.5">
                            <p
                              className={cn(
                                isTotal ? "font-semibold" : "text-black/80 dark:text-white/80",
                              )}
                            >
                              {line.label}
                            </p>
                            {line.note && (
                              <p className="mt-0.5 text-xs text-black/40 dark:text-white/40">
                                {line.note}
                              </p>
                            )}
                          </td>
                          <td
                            className={cn("px-4 py-3.5 text-right tabular-nums",
                              isTotal && "text-lg font-semibold tracking-[-0.02em]",
                              isCredit && "text-black/55 dark:text-white/55",
                            )}
                          >
                            {isCredit
                              ? `− ${formatTnd(Math.abs(line.amountTnd))}`
                              : formatTnd(line.amountTnd)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-black/50 dark:text-white/50">
                About {formatTnd(perDay)} per day for your dates. Refundable
                deposit from {formatTnd(offer.depositTnd)}.
              </p>
            </Section>

            <Section
              id="mileage"
              eyebrow="On the road"
              title="Mileage & fuel"
            >
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">Mileage</p>
                  <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
                    {offer.mileageNote}.{" "}
                    {offer.mileage === "unlimited"
                      ? "Drive Tunis to Djerba or the Sahara routes without counting kilometres on this rate."
                      : "Stay within the included allowance; extra km are charged by the agency at return."}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Fuel</p>
                  <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
                    {offer.fuelPolicy}
                  </p>
                </div>
              </div>
            </Section>

            <Section
              id="protection"
              eyebrow="Cover"
              title="Protection & exclusions"
            >
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-semibold">Included</p>
                  <ul className="space-y-2.5">
                    {offer.protectionIncluded.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm text-black/70 dark:text-white/70"
                      >
                        <Check className="mt-0.5 size-4 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-sm font-semibold">Not covered</p>
                  <ul className="space-y-2.5">
                    {offer.protectionExcluded.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm text-black/70 dark:text-white/70"
                      >
                        <X className="mt-0.5 size-4 shrink-0 opacity-50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-black/40 dark:text-white/40">
                Excess and exact cover wording follow the agency contract you
                sign at pickup. Ask the desk if you need a reduced excess.
              </p>
            </Section>

            <Section
              id="driver"
              eyebrow="Before you go"
              title="Driver & documents"
            >
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-semibold">
                    Requirements · min age {offer.minAge}
                  </p>
                  <ul className="space-y-2.5">
                    {offer.driverRequirements.map((item) => (
                      <li
                        key={item}
                        className="text-sm leading-relaxed text-black/70 dark:text-white/70"
                      >
                        · {item}
                      </li>
                    ))}
                  </ul>
                  {offer.youngDriverFeeNote && (
                    <p className="mt-4 text-sm text-black/50 dark:text-white/50">
                      {offer.youngDriverFeeNote}
                    </p>
                  )}
                </div>
                <div>
                  <p className="mb-3 text-sm font-semibold">Bring these</p>
                  <ul className="space-y-2.5">
                    {offer.documents.map((item) => (
                      <li
                        key={item}
                        className="text-sm leading-relaxed text-black/70 dark:text-white/70"
                      >
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            <Section
              id="pickup"
              eyebrow="Handover"
              title="Pickup instructions"
            >
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-sm font-semibold">{offer.pickupAddress}</p>
                  <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                    {offer.pickupHours}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {offer.pickupInstructions.map((item) => (
                      <li
                        key={item}
                        className="text-sm leading-relaxed text-black/70 dark:text-white/70"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-[12px] border border-black/10 bg-[linear-gradient(160deg,#f4f4f5_0%,#e4e4e7_45%,#d4d4d8_100%)] p-4 dark:bg-[linear-gradient(160deg,#27272a_0%,#18181b_55%,#09090b_100%)]"
                  aria-label={`Map placeholder for ${offer.mapLabel}`}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                  />
                  <div className="relative mx-auto mb-8 flex size-10 items-center justify-center rounded-full border-2 border-black bg-white shadow-sm dark:border-white dark:bg-zinc-900">
                    <MapPin className="size-4" />
                  </div>
                  <div className="relative rounded-[8px] border border-black/10 bg-white/90 px-3 py-2 backdrop-blur dark:bg-black/70">
                    <p className="text-sm font-semibold">{offer.mapLabel}</p>
                    <p className="text-xs text-black/50 dark:text-white/50">
                      {offer.mapHint}
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            <Section
              id="cancellation"
              eyebrow="Flexibility"
              title="Cancellation & no-show"
            >
              <ul className="space-y-3">
                {offer.cancellationRules.map((rule) => (
                  <li
                    key={rule}
                    className="text-sm leading-relaxed text-black/70 dark:text-white/70"
                  >
                    · {rule}
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-[10px] border border-black/10 px-4 py-3 text-sm leading-relaxed text-black/60 dark:text-white/60">
                <span className="font-semibold text-black dark:text-white">
                  No-show:{" "}
                </span>
                {offer.noShowPolicy}
              </p>
            </Section>

            <Section
              id="agency"
              eyebrow="Partner"
              title="Agency"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-[12px] border border-black/10 dark:border-white/15">
                  <Image
                    src={offer.agency.logo}
                    alt={`${offer.agency.name} logo`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">
                      {offer.agency.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Star className="size-3.5 fill-current" />
                      <span className="font-semibold tabular-nums">
                        {offer.agency.rating.toFixed(1)}
                      </span>
                      <span className="text-black/40 dark:text-white/40">
                        ({offer.agency.reviewCount} reviews)
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
                    {offer.agencyBio}
                  </p>
                  <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                    <span className="font-medium">Response: </span>
                    {offer.agencyResponseStyle}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-black/40 dark:text-white/40">
                    {offer.agencyVerifiedNote}
                  </p>
                </div>
              </div>
            </Section>
          </div>

          <BookingRail
            offer={offer}
            days={days}
            variant="desktop"
            checkoutHref={checkoutHref}
          />
        </div>
      </main>

      <BookingRail
        offer={offer}
        days={days}
        variant="mobile"
        checkoutHref={checkoutHref}
      />

      <Footer />
    </div>
  )
}
