import { SEARCH_OFFERS } from "@/lib/search-offers"

export type AgencyProfile = {
  slug: string
  name: string
  logo: string
  city: string
  rating: number
  reviewCount: number
  cities: string[]
  locationLabels: string[]
  offerCount: number
  instantShare: number
  policies: string[]
  reviewsExcerpt: { name: string; rating: number; quote: string }[]
  verificationNote: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

const POLICY_BY_AGENCY: Record<string, string[]> = {
  "Medina Cars Tunis": [
    "Free cancellation windows shown on each offer",
    "Meet & greet available at Tunis-Carthage",
    "Security deposit held separately at pickup",
  ],
  "Carthage Drive": [
    "High share of instant-confirmation offers",
    "Airport desk pickup in Terminal A",
    "Basic CDW included on listed rates",
  ],
  "Atlas Mobility": [
    "Hotel or Airbnb delivery in Greater Tunis",
    "Hybrid options on intermediate cars",
    "Partial refund rules vary by fare type",
  ],
  "Sahara Auto Rent": [
    "Coastal delivery to Hammamet / Enfidha hotels",
    "Request-to-book for larger SUVs",
    "Daily kilometre caps disclosed before checkout",
  ],
  "Groupe Location Sahel": [
    "Monastir Airport partner desk",
    "Van capacity for group travel",
    "Non-refundable rates clearly labelled",
  ],
  "Prestige Tunisie": [
    "Premium meet & greet with name board",
    "White-glove delivery in Tunis / La Marsa",
    "Higher deposits typical for luxury fleet",
  ],
  "Djerba Easy Rent": [
    "Island-focused mileage policies",
    "Djerba-Zarzis Airport meet & greet",
    "Lower deposit economy options",
  ],
  "Nord Auto Location": [
    "Tunis Centre branch pickup",
    "Request confirmation for popular compact cars",
    "Limited daily kilometres on some diesel rates",
  ],
  "Enfidha Rent Plus": [
    "Enfidha-Hammamet Airport meet & greet",
    "Strong Hammamet resort coverage",
    "Agency accepts before booking is final",
  ],
  "Sfax Direct Cars": [
    "Sfax city centre office",
    "Budget economy with clear km limits",
    "Non-refundable promotional rates available",
  ],
}

const REVIEW_EXCERPTS: Record<
  string,
  { name: string; rating: number; quote: string }[]
> = {
  "Medina Cars Tunis": [
    {
      name: "Yasmine B.",
      rating: 5,
      quote: "Airport meet & greet was punctual and the total matched what Wheelio showed.",
    },
    {
      name: "Marc L.",
      rating: 4,
      quote: "Clear deposit explanation at the desk — no surprise fees added on top.",
    },
  ],
  "Carthage Drive": [
    {
      name: "Sara K.",
      rating: 5,
      quote: "Instant confirmation and a clean automatic compact for our Tunis week.",
    },
    {
      name: "Omar H.",
      rating: 5,
      quote: "Desk was easy to find; mileage and fuel policy matched the listing.",
    },
  ],
  "Atlas Mobility": [
    {
      name: "Nadia T.",
      rating: 5,
      quote: "Hotel delivery saved us a taxi from the airport — hybrid Corolla was quiet.",
    },
  ],
  "Sahara Auto Rent": [
    {
      name: "Family R.",
      rating: 4,
      quote: "SUV had room for beach bags; request booking confirmed within a few hours.",
    },
  ],
  "Groupe Location Sahel": [
    {
      name: "Karim M.",
      rating: 4,
      quote: "Nine-seater for our wedding guests — agency was clear about the km limit.",
    },
  ],
  "Prestige Tunisie": [
    {
      name: "Helena V.",
      rating: 5,
      quote: "E-Class meet & greet felt polished without hiding the deposit amount.",
    },
  ],
  "Djerba Easy Rent": [
    {
      name: "Ines D.",
      rating: 4,
      quote: "Small car was perfect for Djerba roads; pickup at the airport was smooth.",
    },
  ],
  "Nord Auto Location": [
    {
      name: "Thomas W.",
      rating: 4,
      quote: "Centre pickup worked well after our hotel stay in Tunis.",
    },
  ],
  "Enfidha Rent Plus": [
    {
      name: "Amira S.",
      rating: 4,
      quote: "Meet & greet at Enfidha — Octavia boot handled all our luggage.",
    },
  ],
  "Sfax Direct Cars": [
    {
      name: "Hedi G.",
      rating: 4,
      quote: "Straightforward city desk pickup and the lowest total we compared.",
    },
  ],
}

export function listAgencies(): AgencyProfile[] {
  const map = new Map<string, AgencyProfile>()

  for (const offer of SEARCH_OFFERS) {
    const slug = slugify(offer.agency.name)
    const existing = map.get(slug)
    if (!existing) {
      map.set(slug, {
        slug,
        name: offer.agency.name,
        logo: offer.agency.logo,
        city: offer.agency.city,
        rating: offer.agency.rating,
        reviewCount: offer.agency.reviewCount,
        cities: [offer.agency.city],
        locationLabels: [offer.agency.locationLabel],
        offerCount: 1,
        instantShare: offer.confirmation === "instant" ? 1 : 0,
        policies:
          POLICY_BY_AGENCY[offer.agency.name] ?? [
            "Policies summarised from listed offers",
            "Deposit held separately at pickup",
            "Cancellation rules shown before you book",
          ],
        reviewsExcerpt:
          REVIEW_EXCERPTS[offer.agency.name] ?? [
            {
              name: "Recent renter",
              rating: Math.round(offer.agency.rating),
              quote: "Booking conditions matched what we saw on Wheelio.",
            },
          ],
        verificationNote:
          "Wheelio has reviewed this agency’s business documents for marketplace listing. This is not a government certification or quality guarantee.",
      })
    } else {
      existing.offerCount += 1
      if (offer.confirmation === "instant") existing.instantShare += 1
      if (!existing.cities.includes(offer.agency.city)) {
        existing.cities.push(offer.agency.city)
      }
      if (!existing.locationLabels.includes(offer.agency.locationLabel)) {
        existing.locationLabels.push(offer.agency.locationLabel)
      }
      // Keep highest rating / review count seen
      if (offer.agency.rating > existing.rating) {
        existing.rating = offer.agency.rating
        existing.reviewCount = offer.agency.reviewCount
      }
    }
  }

  return Array.from(map.values())
    .map((a) => ({
      ...a,
      instantShare: Math.round((a.instantShare / a.offerCount) * 100),
    }))
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
}

export function getAgency(slug: string): AgencyProfile | undefined {
  return listAgencies().find((a) => a.slug === slug)
}

export function listAgencySlugs(): string[] {
  return listAgencies().map((a) => a.slug)
}

export function listAgencyCities(): string[] {
  const cities = new Set<string>()
  for (const a of listAgencies()) {
    for (const c of a.cities) cities.add(c)
  }
  return Array.from(cities).sort()
}

export function searchHrefForAgency(name: string): string {
  return `/search?agency=${encodeURIComponent(name)}`
}
