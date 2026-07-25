"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Clock3,
  FileText,
  Loader2,
  PenLine,
  Shield,
} from "lucide-react"
import { ContractPaper } from "@/components/checkout/contract-paper"
import { saveContractArtifacts } from "@/components/checkout/contract-downloads"
import { SignaturePad } from "@/components/checkout/signature-pad"
import { PageShell } from "@/components/page-shell"
import {
  CHECKOUT_EXTRAS,
  createBookingId,
  type BookingExtraId,
  type PaymentMode,
} from "@/lib/bookings"
import {
  createBookingFromQuote,
  createHold,
  createPaymentIntent,
} from "@/lib/gateways/checkout"
import { useApiCheckoutSlice } from "@/lib/gateways/flags"
import {
  buildContractPayload,
  type ContractPayload,
} from "@/lib/contract-document"
import {
  generateContractPdfs,
  logoUrlToPngDataUrl,
  pdfBytesToBase64,
} from "@/lib/generate-contract-pdf"
import { getOfferDetail } from "@/lib/offer-detail"
import {
  formatTnd,
  formatTripDate,
  parseTripQuery,
  rentalDays,
} from "@/lib/search-utils"
import { cn } from "@/lib/utils"

function fallbackTrip() {
  const pickup = new Date()
  pickup.setDate(pickup.getDate() + 1)
  const dropoff = new Date(pickup)
  dropoff.setDate(dropoff.getDate() + 6)
  const d = (date: Date) => date.toISOString().slice(0, 10)
  return {
    pickupLocation: "Tunis-Carthage Airport",
    dropoffLocation: "Tunis-Carthage Airport",
    pickupDate: d(pickup),
    pickupTime: "10:00",
    dropoffDate: d(dropoff),
    dropoffTime: "10:00",
    driverAge: "30",
    differentReturn: false,
  }
}

function useHold(minutes: number) {
  const [left, setLeft] = useState(minutes * 60)
  useEffect(() => {
    setLeft(minutes * 60)
    const id = window.setInterval(() => {
      setLeft((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [minutes])
  const mm = String(Math.floor(left / 60)).padStart(2, "0")
  const ss = String(left % 60).padStart(2, "0")
  return { label: `${mm}:${ss}`, expired: left === 0 }
}

type FieldErrors = Partial<
  Record<
    | "contactName"
    | "contactEmail"
    | "contactPhone"
    | "driverName"
    | "licenseCountry"
    | "terms"
    | "payment"
    | "signature",
    string
  >
>

type CheckoutStep = "details" | "contract"

const inputClass =
  "h-12 w-full rounded-[8px] border border-black/15 bg-black/[0.03] px-3 text-sm text-black outline-none transition placeholder:text-black/35 hover:border-black/35 focus:border-black focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/35 dark:hover:border-white/35 dark:focus:border-white dark:focus:ring-white/15"

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-black/50 dark:text-white/50"

export function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState<CheckoutStep>("details")

  const offerId = searchParams.get("offerId") || "tn-cmp-208-02"
  const offer = useMemo(() => getOfferDetail(offerId), [offerId])
  const trip = useMemo(
    () => parseTripQuery(searchParams, fallbackTrip()),
    [searchParams],
  )
  const days = rentalDays(trip.pickupDate, trip.dropoffDate)
  const hold = useHold(offer?.holdMinutes ?? 12)

  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("+216 ")
  const [driverName, setDriverName] = useState("")
  const [driverAgeOk, setDriverAgeOk] = useState(false)
  const [licenseCountry, setLicenseCountry] = useState("TN")
  const [flightNumber, setFlightNumber] = useState("")
  const [landingTime, setLandingTime] = useState("")
  const [extras, setExtras] = useState<BookingExtraId[]>([])
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("pay_at_agency")
  const [termsOk, setTermsOk] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [signedAt, setSignedAt] = useState<string | null>(null)
  const [contractAck, setContractAck] = useState(false)
  const [contractRead, setContractRead] = useState(false)
  const [contractPayload, setContractPayload] = useState<ContractPayload | null>(
    null,
  )
  const [composingPdf, setComposingPdf] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const extrasTotal = CHECKOUT_EXTRAS.filter((e) => extras.includes(e.id)).reduce(
    (sum, e) => sum + e.priceTnd,
    0,
  )
  const rentalTotal = offer?.totalPriceTnd ?? 0
  const grandTotal = rentalTotal + extrasTotal
  const dueNow =
    paymentMode === "deposit_online"
      ? Math.max(80, Math.round(grandTotal * 0.2))
      : 0
  const depositAtPickup = offer?.depositTnd ?? 0
  const paymentLabel =
    paymentMode === "deposit_online"
      ? `Online booking deposit (${formatTnd(dueNow)})`
      : "Pay full rental at agency"

  const searchHref = `/search?${searchParams.toString().replace(/offerId=[^&]*&?/, "")}`
  const offerHref = `/cars/${offerId}?${searchParams.toString()}`

  const toggleExtra = (id: BookingExtraId) => {
    setExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const validateDetails = (): boolean => {
    const next: FieldErrors = {}
    if (!contactName.trim()) next.contactName = "Enter your full name"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      next.contactEmail = "Enter a valid email"
    }
    if (contactPhone.replace(/\D/g, "").length < 8) {
      next.contactPhone = "Enter a phone with country code"
    }
    if (!driverName.trim()) next.driverName = "Enter the name as on the licence"
    if (!licenseCountry) next.licenseCountry = "Select licence country"
    if (!driverAgeOk) {
      next.driverName = next.driverName || "Confirm the driver meets the minimum age"
    }
    if (!paymentMode) next.payment = "Choose how you want to pay"
    if (!termsOk) next.terms = "Accept the terms to continue"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateContract = (): boolean => {
    const next: FieldErrors = {}
    if (!signatureDataUrl) {
      next.signature = "Sign the contract with your mouse or finger before paying"
    }
    if (!contractAck) {
      next.signature =
        next.signature || "Confirm you have read and agree to this contract"
    }
    if (!contractRead) {
      next.signature =
        next.signature || "Confirm you have read all articles of the agreement"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const goToContract = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    if (hold.expired) {
      setSubmitError("This price hold ended. Reload the offer to continue.")
      return
    }
    if (!validateDetails()) {
      setSubmitError("Fix the highlighted fields, then continue to the contract.")
      return
    }
    if (!offer) return

    const bookingId = createBookingId(offerId)
    const payload = await buildContractPayload({
      offer,
      trip,
      bookingId,
      contactName,
      contactEmail,
      contactPhone,
      driverName,
      licenseCountry,
      grandTotalTnd: grandTotal,
      extrasTotalTnd: extrasTotal,
      rentalTotalTnd: rentalTotal,
      depositTnd: depositAtPickup,
      paymentLabel,
      customerSignedAtLabel: null,
      agencyConfirmed: false,
    })
    setContractPayload(payload)
    setStep("contract")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const finalizeBooking = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    if (hold.expired) {
      setSubmitError("This price hold ended. Reload the offer to continue.")
      return
    }
    if (!validateContract()) return
    if (pending || composingPdf || !offer || !signatureDataUrl) return

    setComposingPdf(true)
    try {
      const quoteId = searchParams.get("quoteId")
      const quoteVersion = Number(searchParams.get("quoteVersion") ?? "1") || 1
      if (useApiCheckoutSlice() && quoteId) {
        const idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `checkout-${Date.now()}`
        try {
          await createHold(
            quoteId,
            { expectedQuoteVersion: quoteVersion },
            idempotencyKey,
          )
          const booking = await createBookingFromQuote(
            {
              quoteId,
              expectedQuoteVersion: quoteVersion,
              contactEmail,
              contactName,
              driverFullName: driverName,
              driverLicenseCountry: licenseCountry,
              paymentMode,
              locale: document.documentElement.lang === "fr" ? "fr" : "en",
            },
            `booking-${idempotencyKey}`,
          )
          if (paymentMode === "deposit_online") {
            await createPaymentIntent(booking.id, {
              purpose: "rental",
              idempotencyKey: `pi-${booking.id}`,
            })
          }
          startTransition(() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("offerId", offerId)
            params.set("payment", paymentMode)
            params.set("signed", "1")
            router.push(
              `/bookings/${booking.id}/confirmation?${params.toString()}`,
            )
          })
          return
        } catch (apiError) {
          const message =
            apiError instanceof Error
              ? apiError.message
              : "Checkout API failed"
          setSubmitError(message)
          return
        }
      }

      const bookingId = contractPayload?.bookingId || createBookingId(offerId)
      const payload = await buildContractPayload({
        offer,
        trip,
        bookingId,
        contactName,
        contactEmail,
        contactPhone,
        driverName,
        licenseCountry,
        grandTotalTnd: grandTotal,
        extrasTotalTnd: extrasTotal,
        rentalTotalTnd: rentalTotal,
        depositTnd: depositAtPickup,
        paymentLabel,
        customerSignedAtLabel: signedAt,
        agencyConfirmed: offer.confirmation === "instant",
        agencySignedAtLabel:
          offer.confirmation === "instant" ? signedAt : null,
      })

      const agencyLogoPng = await logoUrlToPngDataUrl(offer.agency.logo)
      const wheelioLogoPng = await logoUrlToPngDataUrl(
        "/logos/wheelio-icon.png",
        128,
      )
      const { customerPdf, agencyPdf } = await generateContractPdfs({
        payload,
        customerSignaturePng: signatureDataUrl,
        agencyLogoPng,
        wheelioLogoPng,
      })

      saveContractArtifacts({
        payload,
        customerSignaturePng: signatureDataUrl,
        agencyLogoUrl: offer.agency.logo,
        customerPdfBase64: pdfBytesToBase64(customerPdf),
        agencyPdfBase64: pdfBytesToBase64(agencyPdf),
      })

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("offerId", offerId)
        params.set("payment", paymentMode)
        params.set("extras", extras.join(","))
        params.set("signed", "1")
        params.set("contractId", payload.contractId)
        router.push(`/bookings/${bookingId}/confirmation?${params.toString()}`)
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown PDF composition error"
      console.error("[wheelio-contract]", error)
      setSubmitError(
        `Could not compose the PDF agreement (${message}). Clear the signature and try again.`,
      )
    } finally {
      setComposingPdf(false)
    }
  }

  if (!offer) {
    return (
      <PageShell>
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-2xl font-semibold">Offer not found</h1>
          <p className="mt-2 text-sm text-black/55 dark:text-white/55">
            This deal is no longer available. Pick another car from search.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex h-11 items-center rounded-[8px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Back to search
          </Link>
        </main>
      </PageShell>
    )
  }

  const isAirport = /airport/i.test(trip.pickupLocation)
  const summaryBlock = (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-[8px] bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={offer.image}
            alt=""
            fill
            sizes="64px"
            className="object-cover grayscale-[15%]"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {offer.modelName}
            {offer.orSimilar ? " or similar" : ""}
          </p>
          <p className="text-xs text-black/50 dark:text-white/50">
            {offer.agency.name} · {offer.categoryLabel}
          </p>
          <span
            className={cn("mt-1 inline-flex rounded-[5px] px-2 py-0.5 text-[10px] font-semibold",
              offer.confirmation === "instant"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/20 dark:border-white/20",
            )}
          >
            {offer.confirmation === "instant"
              ? "Instant confirmation"
              : "Agency confirms within ~6 hours"}
          </span>
        </div>
      </div>

      <dl className="space-y-2 border-t border-dashed border-black/15 pt-4 text-sm dark:border-white/15">
        <div className="flex justify-between gap-3">
          <dt className="text-black/55 dark:text-white/55">Rental total</dt>
          <dd className="tabular-nums">{formatTnd(rentalTotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-black/55 dark:text-white/55">Extras</dt>
          <dd className="tabular-nums">{formatTnd(extrasTotal)}</dd>
        </div>
        <div className="flex justify-between gap-3 pt-2 font-semibold">
          <dt>Trip total</dt>
          <dd className="text-lg tabular-nums tracking-[-0.02em]">
            {formatTnd(grandTotal)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-black/55 dark:text-white/55">Due now</dt>
          <dd className="font-medium tabular-nums">{formatTnd(dueNow)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-black/55 dark:text-white/55">
            Refundable deposit at pickup
          </dt>
          <dd className="tabular-nums">{formatTnd(depositAtPickup)}</dd>
        </div>
      </dl>

      <div
        className={cn("flex items-center gap-2 rounded-[8px] border px-3 py-2.5 text-sm",
          hold.expired
            ? "border-black/25 bg-black/[0.03] dark:border-white/25"
            : "border-black/12 dark:border-white/12",
        )}
      >
        <Clock3 className="size-4 opacity-50" />
        {hold.expired ? (
          <span>Hold ended — reload the offer</span>
        ) : (
          <span>
            Price held for{" "}
            <span className="font-semibold tabular-nums">{hold.label}</span>
          </span>
        )}
      </div>

      {step === "contract" ? (
        <div className="flex items-center gap-2 rounded-[8px] border border-black/12 px-3 py-2.5 text-sm dark:border-white/12">
          <PenLine className="size-4 opacity-50" />
          {signatureDataUrl ? (
            <span className="font-medium">Contract signed</span>
          ) : (
            <span>Signature required before payment</span>
          )}
        </div>
      ) : null}
    </div>
  )

  return (
    <PageShell withMobileCtaPad>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
            Checkout
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {step === "details" ? "Finish your booking" : "Sign the contract"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-black/55 dark:text-white/55">
            {step === "details"
              ? "Totals stay in TND. You must sign the rental agreement before payment."
              : "Read the agreement, sign with your mouse or finger, then continue to payment."}
          </p>

          <ol className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
            <li
              className={cn("rounded-[6px] px-2.5 py-1",
                step === "details"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-black/15 text-black/50 dark:border-white/15 dark:text-white/50",
              )}
            >
              1 · Details
            </li>
            <li className="text-black/25 dark:text-white/25">→</li>
            <li
              className={cn("rounded-[6px] px-2.5 py-1",
                step === "contract"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-black/15 text-black/50 dark:border-white/15 dark:text-white/50",
              )}
            >
              2 · Contract & signature
            </li>
            <li className="text-black/25 dark:text-white/25">→</li>
            <li className="rounded-[6px] border border-black/15 px-2.5 py-1 text-black/40 dark:border-white/15 dark:text-white/40">
              3 · Payment
            </li>
          </ol>
        </div>

        {hold.expired ? (
          <div className="mb-6 rounded-[12px] border border-black/20 bg-black/[0.03] px-4 py-4 dark:border-white/20 dark:bg-white/[0.04]">
            <p className="font-semibold">Price hold ended</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              Availability and price may have changed. Reload the offer before
              paying.
            </p>
            <Link
              href={offerHref}
              className="mt-3 inline-flex h-10 items-center rounded-[8px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Reload offer
            </Link>
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0">
            {step === "details" ? (
              <form
                id="checkout-form"
                onSubmit={goToContract}
                className="space-y-10"
                noValidate
              >
                <section className="pb-8">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold tracking-[-0.02em]">
                        Your trip
                      </h2>
                      <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                        {trip.pickupLocation}
                        {trip.differentReturn
                          ? ` → ${trip.dropoffLocation}`
                          : ""}
                      </p>
                      <p className="text-sm text-black/55 dark:text-white/55">
                        {formatTripDate(trip.pickupDate)} {trip.pickupTime} →{" "}
                        {formatTripDate(trip.dropoffDate)} {trip.dropoffTime} ·{" "}
                        {days} day{days === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Link
                      href={searchHref || "/search"}
                      className="text-sm font-semibold underline-offset-2 hover:underline"
                    >
                      Edit search
                    </Link>
                  </div>
                </section>

                <section className="space-y-4 pb-8">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">
                    Contact
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="contactName">
                        Full name
                      </label>
                      <input
                        id="contactName"
                        className={inputClass}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        autoComplete="name"
                      />
                      {errors.contactName ? (
                        <p className="mt-1 text-xs text-black/70 dark:text-white/70">
                          {errors.contactName}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="contactEmail">
                        Email
                      </label>
                      <input
                        id="contactEmail"
                        type="email"
                        className={inputClass}
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        autoComplete="email"
                      />
                      {errors.contactEmail ? (
                        <p className="mt-1 text-xs text-black/70 dark:text-white/70">
                          {errors.contactEmail}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="contactPhone">
                        Phone (Tunisia or intl)
                      </label>
                      <input
                        id="contactPhone"
                        type="tel"
                        className={inputClass}
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+216 XX XXX XXX"
                        autoComplete="tel"
                      />
                      {errors.contactPhone ? (
                        <p className="mt-1 text-xs text-black/70 dark:text-white/70">
                          {errors.contactPhone}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pb-8">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">
                    Main driver
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="driverName">
                        Name as on driving licence
                      </label>
                      <input
                        id="driverName"
                        className={inputClass}
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                      />
                      {errors.driverName ? (
                        <p className="mt-1 text-xs text-black/70 dark:text-white/70">
                          {errors.driverName}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="licenseCountry">
                        Licence country
                      </label>
                      <select
                        id="licenseCountry"
                        className={inputClass}
                        value={licenseCountry}
                        onChange={(e) => setLicenseCountry(e.target.value)}
                      >
                        <option value="TN">Tunisia</option>
                        <option value="FR">France</option>
                        <option value="DE">Germany</option>
                        <option value="IT">Italy</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex cursor-pointer items-start gap-3 text-sm text-black/70 dark:text-white/70">
                        <input
                          type="checkbox"
                          checked={driverAgeOk}
                          onChange={(e) => setDriverAgeOk(e.target.checked)}
                          className="mt-1 size-4 rounded border-black/25 accent-black dark:accent-white"
                        />
                        <span>
                          I confirm the main driver is at least {offer.minAge}{" "}
                          and holds a valid licence for 12+ months.
                        </span>
                      </label>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pb-8">
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.02em]">
                      Flight / arrival{" "}
                      <span className="text-sm font-normal text-black/40 dark:text-white/40">
                        {isAirport ? "recommended" : "optional"}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                      Helps the agency plan meet & greet or after-hours pickup.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="flightNumber">
                        Flight number
                      </label>
                      <input
                        id="flightNumber"
                        className={inputClass}
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        placeholder="TU614"
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="landingTime">
                        Landing time
                      </label>
                      <input
                        id="landingTime"
                        type="time"
                        className={inputClass}
                        value={landingTime}
                        onChange={(e) => setLandingTime(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pb-8">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">
                    Extras
                  </h2>
                  <ul className="space-y-3">
                    {CHECKOUT_EXTRAS.map((extra) => {
                      const on = extras.includes(extra.id)
                      return (
                        <li key={extra.id}>
                          <button
                            type="button"
                            onClick={() => toggleExtra(extra.id)}
                            className={cn("flex w-full items-start gap-3 rounded-[10px] border px-4 py-3 text-left transition",
                              on
                                ? "border-black bg-black/[0.03] dark:border-white dark:bg-white/[0.04]"
                                : "border-black/12 hover:border-black/30 dark:border-white/12 dark:hover:border-white/30",
                            )}
                          >
                            <span
                              className={cn("mt-0.5 flex size-5 items-center justify-center rounded-[4px] border",
                                on
                                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                                  : "border-black/25 dark:border-white/25",
                              )}
                            >
                              {on ? <Check className="size-3.5" /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="font-medium">{extra.label}</span>
                                <span className="text-sm tabular-nums">
                                  {formatTnd(extra.priceTnd)}
                                </span>
                              </span>
                              <span className="mt-0.5 block text-sm text-black/50 dark:text-white/50">
                                {extra.description}
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>

                <section className="space-y-4 pb-8">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">
                    Payment method
                  </h2>
                  <p className="text-sm text-black/50 dark:text-white/50">
                    Choose how you’ll pay — you’ll sign the contract on the next
                    step before anything is charged.
                  </p>
                  <div className="space-y-3">
                    <label
                      className={cn("flex cursor-pointer gap-3 rounded-[10px] border px-4 py-3",
                        paymentMode === "deposit_online"
                          ? "border-black dark:border-white"
                          : "border-black/12 dark:border-white/12",
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMode === "deposit_online"}
                        onChange={() => setPaymentMode("deposit_online")}
                        className="mt-1 accent-black dark:accent-white"
                      />
                      <span>
                        <span className="font-medium">
                          Pay booking deposit online
                        </span>
                        <span className="mt-0.5 block text-sm text-black/50 dark:text-white/50">
                          About 20% now (
                          {formatTnd(Math.max(80, Math.round(grandTotal * 0.2)))}
                          ). Balance and security deposit at pickup.
                        </span>
                      </span>
                    </label>
                    <label
                      className={cn("flex cursor-pointer gap-3 rounded-[10px] border px-4 py-3",
                        paymentMode === "pay_at_agency"
                          ? "border-black dark:border-white"
                          : "border-black/12 dark:border-white/12",
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMode === "pay_at_agency"}
                        onChange={() => setPaymentMode("pay_at_agency")}
                        className="mt-1 accent-black dark:accent-white"
                      />
                      <span>
                        <span className="font-medium">Pay at agency</span>
                        <span className="mt-0.5 block text-sm text-black/50 dark:text-white/50">
                          Nothing due online. Pay the rental at the desk;
                          refundable deposit held on card at pickup.
                        </span>
                      </span>
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">
                    Terms
                  </h2>
                  <div className="rounded-[10px] border border-black/10 px-4 py-3 text-sm leading-relaxed text-black/60 dark:text-white/60">
                    <p className="font-medium text-black dark:text-white">
                      Cancellation summary
                    </p>
                    <p className="mt-1">{offer.cancellationNote}</p>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={termsOk}
                      onChange={(e) => setTermsOk(e.target.checked)}
                      className="mt-1 size-4 rounded border-black/25 accent-black dark:accent-white"
                    />
                    <span>
                      I accept the{" "}
                      <Link href="/terms" className="underline underline-offset-2">
                        customer terms
                      </Link>
                      ,{" "}
                      <Link
                        href="/cancellation-policy"
                        className="underline underline-offset-2"
                      >
                        cancellation policy
                      </Link>
                      , and{" "}
                      <Link
                        href="/privacy"
                        className="underline underline-offset-2"
                      >
                        privacy notice
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.terms ? (
                    <p className="text-xs text-black/70 dark:text-white/70">
                      {errors.terms}
                    </p>
                  ) : null}
                  {submitError ? (
                    <p className="text-sm text-black/80 dark:text-white/80">
                      {submitError}
                    </p>
                  ) : null}
                </section>

                <button
                  type="submit"
                  disabled={hold.expired}
                  className="hidden h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-black text-sm font-semibold text-white transition enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black dark:enabled:hover:bg-zinc-200 lg:inline-flex"
                >
                  <FileText className="size-4" />
                  Continue to contract
                </button>
              </form>
            ) : (
              <form
                id="checkout-form"
                onSubmit={finalizeBooking}
                className="space-y-6"
                noValidate
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep("details")
                    setSubmitError(null)
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                >
                  <ArrowLeft className="size-4" />
                  Back to details
                </button>

                <ContractPaper
                  payload={
                    contractPayload ?? {
                      contractId: "…",
                      bookingId: createBookingId(offerId),
                      issuedAtIso: new Date().toISOString(),
                      issuedAtLabel: "…",
                      hash: "…………",
                      verifyUrl: `/bookings/${createBookingId(offerId)}`,
                      parties: {
                        marketplace: "Wheelio TN",
                        agencyName: offer.agency.name,
                        agencyCity: offer.agency.city,
                        customerName: contactName,
                        customerEmail: contactEmail,
                        customerPhone: contactPhone,
                        driverName,
                        licenseCountry,
                      },
                      vehicle: {
                        modelName: offer.modelName,
                        orSimilar: offer.orSimilar,
                        categoryLabel: offer.categoryLabel,
                        seats: offer.seats,
                        bags: offer.bags,
                        transmission:
                          offer.transmission === "automatic"
                            ? "Automatic"
                            : "Manual",
                        fuel: offer.fuel,
                      },
                      trip: {
                        pickupLocation: trip.pickupLocation,
                        dropoffLocation: trip.dropoffLocation,
                        pickupLabel: "",
                        dropoffLabel: "",
                        days,
                        pickupMethodNote: offer.pickupMethodNote,
                      },
                      priceRows: [],
                      grandTotalTnd: grandTotal,
                      depositTnd: depositAtPickup,
                      paymentLabel,
                      cancellationNote: offer.cancellationNote,
                      fuelPolicy: offer.fuelPolicy,
                      mileageNote: offer.mileageNote,
                      protectionExcluded: offer.protectionExcluded,
                      documents: offer.documents,
                      articles: [],
                      customerSignedAtLabel: signedAt,
                      agencyConfirmed: false,
                      agencySignedAtLabel: null,
                    }
                  }
                  signatureDataUrl={signatureDataUrl}
                  agencyLogoUrl={offer.agency.logo}
                  highlightCustomerPad={!signatureDataUrl}
                />

                <section className="space-y-3 rounded-[12px] border border-black/15 bg-white p-4 dark:border-white/15 dark:bg-zinc-950 sm:p-5">
                  <div className="flex items-center gap-2">
                    <PenLine className="size-4" />
                    <h2 className="text-lg font-semibold tracking-[-0.02em]">
                      Sign on the agreement
                    </h2>
                  </div>
                  <p className="text-sm text-black/55 dark:text-white/55">
                    Sign as{" "}
                    <strong>{driverName || contactName || "the main driver"}</strong>
                    . Your signature is embedded into both Customer and Agency
                    PDFs before payment.
                  </p>
                  <SignaturePad
                    onChange={(data) => {
                      setSignatureDataUrl(data)
                      const label = data
                        ? new Date().toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : null
                      setSignedAt(label)
                      if (contractPayload) {
                        setContractPayload({
                          ...contractPayload,
                          customerSignedAtLabel: label,
                        })
                      }
                    }}
                  />
                  {errors.signature ? (
                    <p className="text-xs text-black/70 dark:text-white/70">
                      {errors.signature}
                    </p>
                  ) : null}

                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={contractRead}
                      onChange={(e) => setContractRead(e.target.checked)}
                      className="mt-1 size-4 rounded border-black/25 accent-black dark:accent-white"
                    />
                    <span>I have read all articles of this rental agreement.</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={contractAck}
                      onChange={(e) => setContractAck(e.target.checked)}
                      className="mt-1 size-4 rounded border-black/25 accent-black dark:accent-white"
                    />
                    <span>
                      My electronic signature confirms this contract before{" "}
                      {paymentMode === "deposit_online"
                        ? "online payment"
                        : "sending the booking"}
                      .
                    </span>
                  </label>
                </section>

                {submitError ? (
                  <p className="text-sm text-black/80 dark:text-white/80">
                    {submitError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={pending || composingPdf || hold.expired}
                  className="hidden h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-black text-sm font-semibold text-white transition enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black dark:enabled:hover:bg-zinc-200 lg:inline-flex"
                >
                  {composingPdf || pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {composingPdf ? "Composing agreement…" : "Submitting…"}
                    </>
                  ) : paymentMode === "deposit_online" ? (
                    "Sign & continue to payment"
                  ) : offer.confirmation === "instant" ? (
                    "Sign & confirm booking"
                  ) : (
                    "Sign & send request"
                  )}
                </button>
              </form>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-[14px] border border-black/15 bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.05)] dark:border-white/15 dark:bg-zinc-950 dark:shadow-none">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
                Order summary · TND
              </p>
              <div className="mt-4">{summaryBlock}</div>
              <p className="mt-4 flex items-start gap-2 text-xs text-black/45 dark:text-white/45">
                <Shield className="mt-0.5 size-3.5 shrink-0" />
                Contract signature is required. Dual PDFs are composed after you
                sign.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 px-4 py-3 backdrop-blur-md dark:bg-zinc-900/95 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40 dark:text-white/40">
              {step === "details"
                ? `Total · due now ${formatTnd(dueNow)}`
                : signatureDataUrl
                  ? "Signed · ready"
                  : "Signature needed"}
            </p>
            <p className="text-xl font-semibold tabular-nums tracking-[-0.03em]">
              {formatTnd(grandTotal)}
            </p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={pending || composingPdf || hold.expired}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-[8px] bg-black px-5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {composingPdf || pending
              ? "…"
              : step === "details"
                ? "Contract"
                : paymentMode === "deposit_online"
                  ? "Pay"
                  : "Confirm"}
          </button>
        </div>
      </div>
    </PageShell>
  )
}
