import type {
  PublicAgency,
  PublicBootstrap,
  PublicLocation,
  PublicReview,
} from "@/lib/contracts/public-catalog"

export const locationFixture: PublicLocation = {
  id: "loc_tunis",
  slug: "tunis-carthage-airport",
  type: "airport",
  region: "Tunis",
  searchPickup: "Tunis-Carthage Airport",
  startingFrom: { amountMillimes: "120000", currency: "TND" },
  name: "Tunis-Carthage Airport",
  shortName: "Tunis Airport",
  blurb: "Pickup at Tunisia's main international airport.",
  intro: "Compare airport rental offers with totals shown in TND.",
  pickupTips: ["Confirm the terminal and meeting point."],
  faqs: [{ question: "Where is pickup?", answer: "Follow your voucher." }],
  locale: "en",
}

export const agencyFixture: PublicAgency = {
  id: "agency_tunis",
  slug: "tunis-rentals",
  name: "Tunis Rentals",
  city: "Tunis",
  logoUrl: null,
  rating: 4.8,
  reviewCount: 12,
  bookingMode: "instant",
  instantEnabled: true,
  bio: "Local rental partner.",
  pickupDescription: "Airport and city pickup.",
  locale: "en",
}

export const reviewFixture: PublicReview = {
  id: "review_1",
  agencyId: agencyFixture.id,
  agencySlug: agencyFixture.slug,
  agencyName: agencyFixture.name,
  locationId: locationFixture.id,
  rating: 5,
  body: "Clear booking and easy pickup.",
  authorDisplayName: "Test Renter",
  submittedAt: "2026-07-20T10:00:00.000Z",
}

export const bootstrapFixture: PublicBootstrap = {
  locale: "en",
  featuredLocations: [locationFixture],
  categories: [
    {
      id: "category_economy",
      code: "economy",
      label: "Economy",
      blurb: "Efficient city cars.",
      whoFor: "Solo travellers and couples.",
      attributes: {},
      locale: "en",
    },
  ],
  featuredAgencies: [agencyFixture],
  featureFlags: { apiCatalog: true },
}
