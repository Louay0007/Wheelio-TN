import type { OfferDetail } from "@/lib/offer-detail"
import type { TripQuery } from "@/lib/search-types"
import { formatTnd, formatTripDate, rentalDays } from "@/lib/search-utils"

export type ContractArticle = {
  number: string
  titleEn: string
  titleFr: string
  body: string
}

export type ContractPriceRow = {
  label: string
  amountTnd: number
  note?: string
}

export type ContractCopyKind = "customer" | "agency"

export type ContractPayload = {
  contractId: string
  bookingId: string
  issuedAtIso: string
  issuedAtLabel: string
  hash: string
  hashFull?: string
  verifyUrl: string
  parties: {
    marketplace: string
    agencyName: string
    agencyCity: string
    customerName: string
    customerEmail: string
    customerPhone: string
    driverName: string
    licenseCountry: string
  }
  vehicle: {
    modelName: string
    orSimilar: boolean
    categoryLabel: string
    seats: number
    bags: number
    transmission: string
    fuel: string
  }
  trip: {
    pickupLocation: string
    dropoffLocation: string
    pickupLabel: string
    dropoffLabel: string
    days: number
    pickupMethodNote: string
  }
  priceRows: ContractPriceRow[]
  grandTotalTnd: number
  depositTnd: number
  paymentLabel: string
  cancellationNote: string
  fuelPolicy: string
  mileageNote: string
  protectionExcluded: string[]
  documents: string[]
  articles: ContractArticle[]
  customerSignedAtLabel: string | null
  agencyConfirmed: boolean
  agencySignedAtLabel: string | null
}

export type BuildContractInput = {
  offer: OfferDetail
  trip: TripQuery
  bookingId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  driverName: string
  licenseCountry: string
  grandTotalTnd: number
  extrasTotalTnd: number
  rentalTotalTnd: number
  depositTnd: number
  paymentLabel: string
  customerSignedAtLabel?: string | null
  agencyConfirmed?: boolean
  agencySignedAtLabel?: string | null
  origin?: string
}

function makeContractId(bookingId: string, issuedAtIso: string) {
  const year = new Date(issuedAtIso).getFullYear()
  const seed = bookingId.replace(/\W/g, "").slice(-8).toUpperCase() || "WHEELIO"
  return `WTN-${year}-${seed}`
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function buildContractPayload(
  input: BuildContractInput,
): Promise<ContractPayload> {
  const {
    offer,
    trip,
    bookingId,
    contactName,
    contactEmail,
    contactPhone,
    driverName,
    licenseCountry,
    grandTotalTnd,
    extrasTotalTnd,
    rentalTotalTnd,
    depositTnd,
    paymentLabel,
  } = input

  const issuedAt = new Date()
  const issuedAtIso = issuedAt.toISOString()
  const issuedAtLabel = issuedAt.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  const days = rentalDays(trip.pickupDate, trip.dropoffDate)
  const contractId = makeContractId(bookingId, issuedAtIso)
  const origin =
    input.origin ||
    (typeof window !== "undefined" ? window.location.origin : "https://wheelio-tn.vercel.app")
  const verifyUrl = `${origin}/bookings/${bookingId}`

  const transmission =
    offer.transmission === "automatic" ? "Automatic" : "Manual"
  const fuel = offer.fuel.charAt(0).toUpperCase() + offer.fuel.slice(1)

  const priceRows: ContractPriceRow[] = [
    {
      label: `Rental (${days} day${days === 1 ? "" : "s"})`,
      amountTnd: rentalTotalTnd,
    },
    ...(extrasTotalTnd > 0
      ? [{ label: "Optional extras", amountTnd: extrasTotalTnd }]
      : []),
    {
      label: "Mandatory trip total",
      amountTnd: grandTotalTnd,
      note: "Excludes refundable security deposit",
    },
  ]

  const articles: ContractArticle[] = [
    {
      number: "1",
      titleEn: "Parties",
      titleFr: "Parties",
      body: `This booking is arranged by Wheelio TN (marketplace intermediary) between the Customer and the local rental agency ${offer.agency.name} (${offer.agency.city}). Wheelio does not own the vehicle. The agency issues the physical rental papers and holds the security deposit at pickup.`,
    },
    {
      number: "2",
      titleEn: "Customer and driver",
      titleFr: "Client et conducteur",
      body: `Contact: ${contactName}, ${contactEmail}, ${contactPhone}. Main driver (as on licence): ${driverName}. Licence country: ${licenseCountry}. The driver must meet the agency minimum age and hold a valid licence for at least twelve months.`,
    },
    {
      number: "3",
      titleEn: "Vehicle and trip",
      titleFr: "Véhicule et trajet",
      body: `Vehicle: ${offer.modelName}${offer.orSimilar ? " or similar" : ""} (${offer.categoryLabel}). Pickup: ${trip.pickupLocation} on ${formatTripDate(trip.pickupDate)} at ${trip.pickupTime}. Return: ${trip.differentReturn ? trip.dropoffLocation : trip.pickupLocation} on ${formatTripDate(trip.dropoffDate)} at ${trip.dropoffTime}. Duration: ${days} day(s). Handover: ${offer.pickupMethodNote}.`,
    },
    {
      number: "4",
      titleEn: "Price and deposit (TND)",
      titleFr: "Prix et caution (TND)",
      body: `Mandatory trip total: ${formatTnd(grandTotalTnd)}. Payment choice: ${paymentLabel}. Refundable security deposit at pickup: ${formatTnd(depositTnd)} — held separately and never mixed into the booking total without an explicit label.`,
    },
    {
      number: "5",
      titleEn: "Mileage and fuel",
      titleFr: "Kilométrage et carburant",
      body: `${offer.mileageNote}. ${offer.fuelPolicy}`,
    },
    {
      number: "6",
      titleEn: "Protection exclusions",
      titleFr: "Exclusions de couverture",
      body: offer.protectionExcluded.join("; ") + ".",
    },
    {
      number: "7",
      titleEn: "Documents at pickup",
      titleFr: "Documents à la prise en charge",
      body: offer.documents.join("; ") + ".",
    },
    {
      number: "8",
      titleEn: "Cancellation",
      titleFr: "Annulation",
      body: offer.cancellationNote + " Agency-side cancellations through Wheelio are refunded for amounts paid via the marketplace, subject to the published policy.",
    },
    {
      number: "9",
      titleEn: "Electronic signature and integrity",
      titleFr: "Signature electronique et integrite",
      body: "The Customer's drawn signature on this instrument has the same intent as a handwritten signature for this booking request. Wheelio applies a marketplace attestation seal. A SHA-256 content hash binds the parties, trip, price and signature metadata. The Partner Agency stamp is applied when the booking is confirmed. Scan the QR code to verify the booking record.",
    },
    {
      number: "10",
      titleEn: "Governing framework",
      titleFr: "Cadre applicable",
      body: "Wheelio acts as a marketplace intermediary in Tunisia. The local agency remains the vehicle lessor. Customer marketplace terms, cancellation policy and privacy notice published on wheelio.tn apply to the booking request. Physical handover terms follow the agency desk contract at pickup.",
    },
    {
      number: "11",
      titleEn: "Document references",
      titleFr: "References documentaires",
      body: `Primary instrument: ${contractId}. Booking record: ${bookingId}. Verification URI: ${verifyUrl}. Integrity digest: SHA-256 over parties, vehicle, trip, totals and article text. Companion artefacts: Customer Copy and Agency Copy (identical body; copy watermark differs). Related policies: Wheelio Terms of Use; Cancellation Policy; Privacy Notice; Agency desk rental form at pickup.`,
    },
  ]

  const hashSource = JSON.stringify({
    contractId,
    bookingId,
    parties: {
      contactName,
      driverName,
      agency: offer.agency.name,
    },
    vehicle: offer.modelName,
    trip,
    grandTotalTnd,
    depositTnd,
    articles: articles.map((a) => a.body),
  })

  const hash = await sha256Hex(hashSource)
  const hashShort = hash.slice(0, 16).toUpperCase()
  const hashFull = hash.toUpperCase()

  return {
    contractId,
    bookingId,
    issuedAtIso,
    issuedAtLabel,
    hash: hashShort,
    hashFull,
    verifyUrl,
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
      transmission,
      fuel,
    },
    trip: {
      pickupLocation: trip.pickupLocation,
      dropoffLocation: trip.differentReturn
        ? trip.dropoffLocation
        : trip.pickupLocation,
      pickupLabel: `${formatTripDate(trip.pickupDate)} ${trip.pickupTime}`,
      dropoffLabel: `${formatTripDate(trip.dropoffDate)} ${trip.dropoffTime}`,
      days,
      pickupMethodNote: offer.pickupMethodNote,
    },
    priceRows,
    grandTotalTnd,
    depositTnd,
    paymentLabel,
    cancellationNote: offer.cancellationNote,
    fuelPolicy: offer.fuelPolicy,
    mileageNote: offer.mileageNote,
    protectionExcluded: offer.protectionExcluded,
    documents: offer.documents,
    articles,
    customerSignedAtLabel: input.customerSignedAtLabel ?? null,
    agencyConfirmed: Boolean(input.agencyConfirmed),
    agencySignedAtLabel: input.agencySignedAtLabel ?? null,
  }
}

export function contractStorageKey(bookingId: string) {
  return `wheelio-contract-${bookingId}`
}

export type StoredContractArtifacts = {
  payload: ContractPayload
  customerSignaturePng: string
  agencyLogoUrl?: string
  customerPdfBase64: string
  agencyPdfBase64: string
}
