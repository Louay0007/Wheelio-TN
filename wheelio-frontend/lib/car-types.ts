import type { VehicleCategory } from "@/lib/search-types"

export type CarTypeSlug =
  | "economy"
  | "compact"
  | "intermediate"
  | "suv"
  | "van"
  | "luxury"
  | "automatic"

export type CarTypePage = {
  slug: CarTypeSlug
  title: string
  shortLabel: string
  blurb: string
  whoFor: string
  typicalUse: string[]
  /** Maps to VehicleCategory for CategoryIcon; null for automatic filter-only type */
  category: VehicleCategory | null
  searchHint: string
}

export const CAR_TYPES: CarTypePage[] = [
  {
    slug: "economy",
    title: "Economy cars",
    shortLabel: "Economy",
    blurb:
      "Small, fuel-efficient hatchbacks for city driving and short coastal hops — usually the lowest total price in TND.",
    whoFor:
      "Solo travellers, couples, and anyone prioritising a clear low total over cabin space.",
    typicalUse: ["Tunis city errands", "Airport transfers", "Budget weekenders"],
    category: "economy",
    searchHint: "category=economy",
  },
  {
    slug: "compact",
    title: "Compact cars",
    shortLabel: "Compact",
    blurb:
      "A step up in comfort and boot space while staying easy to park in medina-adjacent streets.",
    whoFor:
      "Pairs or small families who want AC, a usable boot, and a manageable footprint.",
    typicalUse: ["Mixed city + beach", "Two soft bags + cabin bags", "Daily driving"],
    category: "compact",
    searchHint: "category=compact",
  },
  {
    slug: "intermediate",
    title: "Intermediate cars",
    shortLabel: "Intermediate",
    blurb:
      "Midsize sedans and hatchbacks with more luggage room for multi-city Tunisia itineraries.",
    whoFor:
      "Families of three or four, longer road trips, and travellers who prefer a calmer highway ride.",
    typicalUse: ["Tunis–Sousse–Hammamet loops", "Hotel delivery pickups", "Hybrid options"],
    category: "intermediate",
    searchHint: "category=intermediate",
  },
  {
    slug: "suv",
    title: "SUVs",
    shortLabel: "SUV",
    blurb:
      "Higher seating position and larger boots for coastal family trips and uneven secondary roads.",
    whoFor:
      "Families with luggage, diaspora summer visits, and anyone who wants extra ground clearance.",
    typicalUse: ["Beach resorts", "Child seats + soft bags", "Hammamet / Enfidha corridors"],
    category: "suv",
    searchHint: "category=suv",
  },
  {
    slug: "van",
    title: "Vans & people carriers",
    shortLabel: "Van",
    blurb:
      "Seven- to nine-seaters for groups sharing one booking instead of two smaller cars.",
    whoFor:
      "Extended families, wedding parties, and tour groups moving together between cities.",
    typicalUse: ["Airport group pickup", "Sahel day trips", "Shared luggage loads"],
    category: "van",
    searchHint: "category=van",
  },
  {
    slug: "luxury",
    title: "Luxury cars",
    shortLabel: "Luxury",
    blurb:
      "Premium sedans for business travel and special occasions — still compared in clear TND totals.",
    whoFor:
      "Executive travellers, VIP airport arrivals, and celebrations where presentation matters.",
    typicalUse: ["Meet & greet", "La Marsa / Tunis delivery", "Business itineraries"],
    category: "luxury",
    searchHint: "category=luxury",
  },
  {
    slug: "automatic",
    title: "Automatic transmission",
    shortLabel: "Automatic",
    blurb:
      "Filter for automatics across categories — useful if you are used to automatic-only driving or prefer city traffic without a clutch.",
    whoFor:
      "Visitors unfamiliar with manuals, diaspora renters, and anyone who wants an easier stop-start commute.",
    typicalUse: ["City traffic", "Airport pickups", "First-time Tunisia drivers"],
    category: null,
    searchHint: "transmission=automatic",
  },
]

export function getCarType(slug: string): CarTypePage | undefined {
  return CAR_TYPES.find((t) => t.slug === slug)
}

export function listCarTypeSlugs(): CarTypeSlug[] {
  return CAR_TYPES.map((t) => t.slug)
}

export function searchHrefForType(type: CarTypePage): string {
  return `/search?${type.searchHint}`
}
