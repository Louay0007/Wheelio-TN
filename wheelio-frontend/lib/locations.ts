export type LocationCategory = {
  label: string
  href: string
}

export type LocationFaq = {
  question: string
  answer: string
}

export type LocationPlace = {
  slug: string
  name: string
  shortName: string
  type: "airport" | "city"
  region: string
  blurb: string
  intro: string
  startingFromTnd?: number
  pickupTips: string[]
  categories: LocationCategory[]
  faqs: LocationFaq[]
  searchPickup: string
}

export const LOCATIONS: LocationPlace[] = [
  {
    slug: "tunis-carthage",
    name: "Tunis-Carthage Airport",
    shortName: "Tunis-Carthage",
    type: "airport",
    region: "Tunis",
    blurb: "Compare airport desks and meet & greet for arrivals into Tunis.",
    intro:
      "Renting at Tunis-Carthage (TUN) is the most common start for trips across northern Tunisia. Compare local agencies on Wheelio with clear totals in TND, Instant or Request confirmation, and deposit shown separately before you fly.",
    startingFromTnd: 95,
    searchPickup: "Tunis-Carthage Airport",
    pickupTips: [
      "Check whether pickup is terminal desk, meet & greet, or off-airport shuttle on your voucher.",
      "Update your flight number if delayed — many partners wait within a stated window.",
      "Have licence, passport/ID, and deposit card ready before joining the queue.",
      "Photograph the car’s exterior and fuel level at handover.",
    ],
    categories: [
      { label: "Economy", href: "/search?category=economy" },
      { label: "Compact", href: "/search?category=compact" },
      { label: "SUV", href: "/search?category=suv" },
      { label: "Automatic", href: "/search?transmission=automatic" },
    ],
    faqs: [
      {
        question: "Is Tunis-Carthage pickup available late at night?",
        answer:
          "Only when the specific offer lists after-hours service. Do not assume every agency desk is open 24/7.",
      },
      {
        question: "Can I return the car in another city?",
        answer:
          "Yes if you book a one-way offer. Search with a different return location to see agencies that support it.",
      },
    ],
  },
  {
    slug: "tunis-centre",
    name: "Tunis Centre",
    shortName: "Tunis Centre",
    type: "city",
    region: "Tunis",
    blurb: "City pickup for stays in Tunis without an airport transfer.",
    intro:
      "Tunis Centre pickups suit travellers already in the capital — hotels, Lac, or downtown. Compare agencies that offer branch pickup or delivery, with transparent TND pricing and policies.",
    startingFromTnd: 85,
    searchPickup: "Tunis Centre",
    pickupTips: [
      "Confirm the exact branch address or delivery point on your voucher.",
      "Allow time for city traffic at peak hours when heading to return.",
      "Ask about parking rules if the branch is in a dense neighbourhood.",
      "Delivery fees, if any, appear in the mandatory total when required.",
    ],
    categories: [
      { label: "Economy", href: "/search?category=economy" },
      { label: "Compact", href: "/search?category=compact" },
      { label: "Intermediate", href: "/search?category=intermediate" },
      { label: "Van", href: "/search?category=van" },
    ],
    faqs: [
      {
        question: "Can the agency deliver to my hotel in Tunis?",
        answer:
          "Some partners offer delivery or meet at a hotel. Filter by pickup method on search or read the offer details.",
      },
      {
        question: "Is an airport return possible?",
        answer:
          "Book one-way to Tunis-Carthage when available. One-way fees are shown in the total before checkout.",
      },
    ],
  },
  {
    slug: "monastir",
    name: "Monastir Habib Bourguiba Airport",
    shortName: "Monastir",
    type: "airport",
    region: "Sahel",
    blurb: "Airport hire for the Sahel coast — Monastir, Sousse, and nearby resorts.",
    intro:
      "Monastir Airport (MIR) is a convenient gateway for the Sahel. Use Wheelio to compare agencies serving the terminal and nearby towns, with total prices in TND and clear Instant vs Request labels.",
    startingFromTnd: 90,
    searchPickup: "Monastir Airport",
    pickupTips: [
      "Follow voucher instructions for desk location inside or outside the terminal.",
      "Summer queues can be long — have documents ready.",
      "Check fuel policy before leaving the airport area.",
      "One-way to Sousse or Tunis may be available on selected offers.",
    ],
    categories: [
      { label: "Economy", href: "/search?category=economy" },
      { label: "SUV", href: "/search?category=suv" },
      { label: "Automatic", href: "/search?transmission=automatic" },
      { label: "Family / Van", href: "/search?category=van" },
    ],
    faqs: [
      {
        question: "How far is Monastir Airport from Sousse?",
        answer:
          "Roughly 20–30 minutes by car depending on traffic. Many visitors pick up in Monastir and drive to Sousse hotels.",
      },
      {
        question: "Do I need an International Driving Permit?",
        answer:
          "Recommended if your licence is not in Latin script, or if the agency lists it as required on the offer.",
      },
    ],
  },
  {
    slug: "sousse",
    name: "Sousse",
    shortName: "Sousse",
    type: "city",
    region: "Sahel",
    blurb: "City and hotel-area rentals along Tunisia’s busiest resort coast.",
    intro:
      "Sousse is ideal for coastal stays and day trips to El Jem or Kairouan. Compare local agencies on Wheelio for branch or delivery pickup, with deposits and cancellation rules shown up front.",
    startingFromTnd: 88,
    searchPickup: "Sousse",
    pickupTips: [
      "Confirm whether pickup is at a town branch or hotel delivery.",
      "Ask about parking and Medina access restrictions for larger vehicles.",
      "Return with the agreed fuel level to avoid refuelling fees.",
      "Keep toll and fine receipts if the agency requests them at return.",
    ],
    categories: [
      { label: "Compact", href: "/search?category=compact" },
      { label: "SUV", href: "/search?category=suv" },
      { label: "Automatic", href: "/search?transmission=automatic" },
      { label: "Economy", href: "/search?category=economy" },
    ],
    faqs: [
      {
        question: "Can I pick up in Sousse and return at Monastir Airport?",
        answer:
          "Search with different return location. One-way availability depends on the agency.",
      },
      {
        question: "Are automatics easy to find in Sousse?",
        answer:
          "Supply varies by season. Filter transmission = automatic on search to see live availability.",
      },
    ],
  },
  {
    slug: "enfidha-hammamet",
    name: "Enfidha-Hammamet Airport",
    shortName: "Enfidha-Hammamet",
    type: "airport",
    region: "Sahel",
    blurb: "Airport gateway for Hammamet, Yasmine, and the northern Sahel.",
    intro:
      "Enfidha-Hammamet (NBE) serves many charter and seasonal flights. Compare agencies that meet arrivals or run shuttles, with honest after-hours notes and TND totals on every offer.",
    startingFromTnd: 92,
    searchPickup: "Enfidha-Hammamet Airport",
    pickupTips: [
      "Seasonal schedules mean desk hours vary — trust the voucher, not assumptions.",
      "Meet & greet is common; look for your name or agency sign in arrivals.",
      "Hammamet resorts are a drive inland or along the coast — confirm navigation offline if needed.",
      "Update flight delays early so partners can adjust.",
    ],
    categories: [
      { label: "Economy", href: "/search?category=economy" },
      { label: "Compact", href: "/search?category=compact" },
      { label: "SUV", href: "/search?category=suv" },
      { label: "Luxury", href: "/search?category=luxury" },
    ],
    faqs: [
      {
        question: "Is Enfidha closer to Hammamet than Tunis Airport?",
        answer:
          "Yes for most Hammamet and Yasmine hotels. Tunis-Carthage is better if your trip centres on Tunis city.",
      },
      {
        question: "What if my flight lands after desk closing?",
        answer:
          "Only book offers that explicitly include late pickup. Otherwise choose a different arrival time or location.",
      },
    ],
  },
  {
    slug: "djerba",
    name: "Djerba–Zarzis Airport",
    shortName: "Djerba",
    type: "airport",
    region: "Djerba",
    blurb: "Island arrivals with local agencies used to resort and tour traffic.",
    intro:
      "Djerba–Zarzis (DJE) is the main entry for island holidays. Compare cars for zone hopping, beach hotels, and day trips, with clear mileage and deposit terms in TND.",
    startingFromTnd: 100,
    searchPickup: "Djerba Airport",
    pickupTips: [
      "Island driving is straightforward; still check insurance excess on the voucher.",
      "Confirm if ferry or mainland one-ways are allowed before planning a long itinerary.",
      "Summer heat: verify AC is listed on the offer category.",
      "Keep the agency phone handy for resort delivery slots.",
    ],
    categories: [
      { label: "Economy", href: "/search?category=economy" },
      { label: "Compact", href: "/search?category=compact" },
      { label: "SUV", href: "/search?category=suv" },
      { label: "Automatic", href: "/search?transmission=automatic" },
    ],
    faqs: [
      {
        question: "Can I take a Djerba rental to the mainland?",
        answer:
          "Only if the agency contract allows it. Ask before you book or at pickup — cross-sea rules vary.",
      },
      {
        question: "Are unlimited kilometres common on Djerba?",
        answer:
          "Many resort offers include generous or unlimited mileage, but always read the offer badge and details.",
      },
    ],
  },
  {
    slug: "hammamet",
    name: "Hammamet",
    shortName: "Hammamet",
    type: "city",
    region: "Nabeul",
    blurb: "Resort-town rentals for Medina visits and Cap Bon drives.",
    intro:
      "Hammamet and Yasmine Hammamet travellers often prefer local branch or hotel delivery over airport queues. Wheelio lists partner agencies with transparent totals and Instant / Request status.",
    startingFromTnd: 90,
    searchPickup: "Hammamet",
    pickupTips: [
      "Hotel delivery windows are often fixed — be present with documents.",
      "Medina streets can be narrow; compact cars are easier for old-town stops.",
      "Return inspections may happen at the branch, not the hotel lobby.",
      "Combine with Enfidha or Tunis one-ways when your flights differ from your stay.",
    ],
    categories: [
      { label: "Compact", href: "/search?category=compact" },
      { label: "Economy", href: "/search?category=economy" },
      { label: "SUV", href: "/search?category=suv" },
      { label: "Automatic", href: "/search?transmission=automatic" },
    ],
    faqs: [
      {
        question: "Should I fly into Enfidha or Tunis for Hammamet?",
        answer:
          "Enfidha is usually closer. Tunis-Carthage works if you also visit Tunis; use one-way search when needed.",
      },
      {
        question: "Is a credit card required for the deposit?",
        answer:
          "Most agencies require a credit card in the lead driver’s name. Check the offer if only debit or cash is accepted.",
      },
    ],
  },
  {
    slug: "sfax",
    name: "Sfax",
    shortName: "Sfax",
    type: "city",
    region: "South / Centre",
    blurb: "Business and regional travel hub with local agency coverage.",
    intro:
      "Sfax serves business trips and onward travel toward the south. Compare verified local agencies on Wheelio for city pickup, with TND pricing and policies you can read before you commit.",
    startingFromTnd: 80,
    searchPickup: "Sfax",
    pickupTips: [
      "Confirm branch opening hours — not all partners match airport schedules.",
      "For early flights out of other cities, check one-way options in advance.",
      "Carry the booking voucher digitally and as a screenshot offline.",
      "Note any regional driving restrictions the agency mentions for southern routes.",
    ],
    categories: [
      { label: "Economy", href: "/search?category=economy" },
      { label: "Intermediate", href: "/search?category=intermediate" },
      { label: "SUV", href: "/search?category=suv" },
      { label: "Van", href: "/search?category=van" },
    ],
    faqs: [
      {
        question: "Can I pick up in Sfax and return in Tunis?",
        answer:
          "Possible on one-way offers when agencies allow it. Search with Tunis as the return location.",
      },
      {
        question: "Are there airport desks in Sfax?",
        answer:
          "Coverage is mainly city branches. Check each offer’s pickup method for the exact meeting point.",
      },
    ],
  },
]

export function getLocation(slug: string): LocationPlace | undefined {
  return LOCATIONS.find((l) => l.slug === slug)
}

export function getOtherLocations(slug: string): LocationPlace[] {
  return LOCATIONS.filter((l) => l.slug !== slug)
}
