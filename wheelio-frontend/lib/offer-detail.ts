import { SEARCH_OFFERS } from "@/lib/search-offers"
import type { RentalOffer } from "@/lib/search-types"

export type PriceLine = {
  label: string
  amountTnd: number
  note?: string
  kind?: "debit" | "credit" | "total" | "info"
}

export type OfferNotice = {
  id: string
  title: string
  body: string
  severity: "info" | "warn"
}

export type OfferDetail = RentalOffer & {
  gallery: string[]
  daysDefault: number
  priceLines: PriceLine[]
  fuelPolicy: string
  protectionIncluded: string[]
  protectionExcluded: string[]
  driverRequirements: string[]
  documents: string[]
  minAge: number
  youngDriverFeeNote: string | null
  pickupAddress: string
  pickupHours: string
  pickupInstructions: string[]
  mapLabel: string
  mapHint: string
  cancellationRules: string[]
  noShowPolicy: string
  agencyBio: string
  agencyResponseStyle: string
  agencyVerifiedNote: string
  notices: OfferNotice[]
  holdMinutes: number
}

const EXTRA_PHOTOS = [
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1400&q=80",
]

function buildPriceLines(offer: RentalOffer, days: number): PriceLine[] {
  const total = offer.totalPriceTnd
  const delivery =
    offer.pickupMethod === "delivery" ? Math.min(80, Math.round(total * 0.08)) : 0
  const airport =
    offer.agency.locationLabel.toLowerCase().includes("airport") ||
    offer.pickupMethod === "meet_greet" ||
    offer.pickupMethod === "counter"
      ? Math.min(60, Math.round(total * 0.07))
      : 0
  const taxes = Math.round(total * 0.12)
  const discount =
    offer.sponsored || offer.recommendedScore >= 92
      ? Math.min(40, Math.round(total * 0.05))
      : 0
  const rental = total - airport - taxes - delivery + discount

  const lines: PriceLine[] = [
    {
      label: `Rental (${days} day${days === 1 ? "" : "s"})`,
      amountTnd: rental,
      note: `${Math.round(rental / days)} TND / day before fees`,
    },
    ...(airport
      ? [
          {
            label: "Airport / station fee",
            amountTnd: airport,
            note: "Mandatory for this pickup",
          } satisfies PriceLine,
        ]
      : []),
    ...(delivery
      ? [
          {
            label: "Delivery",
            amountTnd: delivery,
            note: offer.pickupMethodNote,
          } satisfies PriceLine,
        ]
      : []),
    {
      label: "Local taxes & service",
      amountTnd: taxes,
    },
    ...(discount
      ? [
          {
            label: "Wheelio partner discount",
            amountTnd: -discount,
            kind: "credit" as const,
          },
        ]
      : []),
    {
      label: "Total mandatory price",
      amountTnd: total,
      kind: "total",
      note: "What you pay for this booking — deposit is separate",
    },
  ]

  return lines
}

function buildNotices(offer: RentalOffer): OfferNotice[] {
  const notices: OfferNotice[] = []

  if (offer.category === "luxury" || offer.depositTnd >= 2500) {
    notices.push({
      id: "deposit-card",
      title: "Deposit held on a card",
      body: `Expect a refundable hold of about ${offer.depositTnd.toLocaleString("fr-TN")} TND on a credit card at pickup. Debit cards are often refused for this category.`,
      severity: "warn",
    })
  }

  if (offer.pickupMethod === "meet_greet" || offer.pickupMethod === "counter") {
    notices.push({
      id: "after-hours",
      title: "After-hours arrivals",
      body: "Flights landing after desk hours may need a pre-arranged meet. Add your flight number at checkout so the agency can plan.",
      severity: "info",
    })
  }

  if (offer.pickupMethod === "delivery") {
    notices.push({
      id: "one-way",
      title: "One-way & delivery zone",
      body: "Delivery is priced for Greater Tunis (or the listed city zone). Returns outside that zone can add a one-way fee — confirm at checkout if you need a different drop-off.",
      severity: "info",
    })
  }

  notices.push({
    id: "young-driver",
    title: "Young driver surcharge",
    body:
      offer.category === "luxury" || offer.category === "suv"
        ? "Drivers under 25 usually pay an extra daily fee on this class, set by the agency at pickup."
        : "Drivers 21–24 may pay a small daily young-driver fee. Under 21 is rarely accepted for this offer.",
    severity: "info",
  })

  return notices
}

export function getOfferPriceLines(
  offer: RentalOffer,
  days: number,
): PriceLine[] {
  return buildPriceLines(offer, days)
}

export function getOfferDetail(
  offerId: string,
  days = 6,
): OfferDetail | null {
  const offer = SEARCH_OFFERS.find((item) => item.id === offerId)
  if (!offer) return null

  const gallery = [
    offer.image,
    ...EXTRA_PHOTOS.filter((url) => url !== offer.image).slice(0, 4),
  ]

  const minAge =
    offer.category === "luxury" ? 25 : offer.category === "suv" ? 23 : 21

  const pickupMethodLabel =
    offer.pickupMethod === "meet_greet"
      ? "Meet & greet"
      : offer.pickupMethod === "delivery"
        ? "Delivery"
        : "Agency counter"

  return {
    ...offer,
    gallery,
    daysDefault: days,
    priceLines: buildPriceLines(offer, days),
    fuelPolicy:
      offer.fuel === "electric"
        ? "Return with a similar battery level. Charging stops on the route are the driver’s responsibility."
        : "Full-to-full: pick up with a full tank and return full. Keep fuel receipts if you top up near drop-off.",
    protectionIncluded: [
      "Third-party liability (Tunisian road cover)",
      "Basic collision damage waiver with excess",
      "Theft waiver subject to police report & keys returned",
      ...offer.included.filter((item) =>
        /protection|waiver|assist|tax|fee|surcharge/i.test(item),
      ),
    ],
    protectionExcluded: [
      "Tyres, glass, underbody, and interior damage",
      "Driving off marked roads or flooded tracks",
      "Lost keys, wrong fuel, and negligence",
      "Personal belongings left in the car",
    ],
    driverRequirements: [
      `Main driver at least ${minAge} years old`,
      "Valid driving licence held for 12+ months",
      "Credit card in the main driver’s name for the deposit",
      "Same name on booking, licence, and card",
    ],
    documents: [
      "Passport or Tunisian national ID",
      "Driving licence (EU / UK / US usually fine; international permit recommended for other licences)",
      "Booking confirmation (email or Wheelio reference)",
      "Flight number helpful for airport meet & greet",
    ],
    minAge,
    youngDriverFeeNote:
      minAge > 21
        ? `Under ${minAge}: this agency may refuse or add a daily fee — confirm before you travel.`
        : "Ages 21–24: a young-driver fee may apply at the desk.",
    pickupAddress: offer.agency.locationLabel,
    pickupHours:
      offer.pickupMethod === "delivery"
        ? "Delivery windows 08:00–20:00 (city dependent)"
        : "Desk roughly 07:00–22:00 · after-hours by arrangement",
    pickupInstructions: [
      `${pickupMethodLabel}: ${offer.pickupMethodNote}.`,
      "Share your landing time if you fly into Tunis-Carthage, Monastir, Enfidha, or Djerba.",
      "Inspect the car and photos together before you leave the lot.",
    ],
    mapLabel: offer.agency.locationLabel,
    mapHint: `${offer.agency.city} · exact pin shared after confirmation`,
    cancellationRules: [
      offer.cancellationNote,
      offer.cancellation === "free"
        ? "Cancel online before the free window ends — no rental charge."
        : offer.cancellation === "partial"
          ? "After the free/partial window, a percentage of the rental may be kept."
          : "This rate is non-refundable once confirmed.",
      "Agency-side cancellations get a full refund of amounts paid through Wheelio.",
    ],
    noShowPolicy:
      "No-show without notice usually means the full rental amount is charged and the deposit hold is released once the desk closes the file.",
    agencyBio: `${offer.agency.name} is a local Tunisian partner serving ${offer.agency.city}. They handle the car, deposit, and pickup — Wheelio shows the compared total up front.`,
    agencyResponseStyle:
      offer.confirmation === "instant"
        ? "Mostly instant confirmation on this fleet"
        : "Request to book — typically answers within a few hours during desk time",
    agencyVerifiedNote:
      "Documents reviewed by Wheelio for marketplace listing. This is not a government licence badge.",
    notices: buildNotices(offer),
    holdMinutes: 12,
  }
}

export function listOfferIds(): string[] {
  return SEARCH_OFFERS.map((offer) => offer.id)
}
