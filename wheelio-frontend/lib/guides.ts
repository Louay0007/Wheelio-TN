export type GuideSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export type GuideArticle = {
  slug: string
  title: string
  description: string
  readMinutes: number
  updated: string
  intro: string
  sections: GuideSection[]
  midCta: { title: string; body: string }
}

export const GUIDES: GuideArticle[] = [
  {
    slug: "rent-car-tunisia-documents",
    title: "What you need to rent a car in Tunisia",
    description:
      "Documents, age rules, and deposit expectations when comparing Tunisian rental agencies.",
    readMinutes: 6,
    updated: "2026-06-01",
    intro:
      "Renting in Tunisia is straightforward when you know which documents agencies expect and how deposits appear separately from the rental total. This guide covers the usual checklist — always re-check the offer page before you book.",
    midCta: {
      title: "Compare cars with clear totals",
      body: "See mandatory price, deposit, and confirmation type side by side in TND.",
    },
    sections: [
      {
        heading: "Core documents",
        paragraphs: [
          "Most partner agencies ask for a valid driving licence held for at least one year, a passport or national ID, and a payment card for the security deposit at pickup.",
        ],
        bullets: [
          "Driving licence (original) — international permit may help if your licence is not Latin-script",
          "Passport or Tunisian national ID",
          "Credit or debit card in the main driver’s name for the deposit hold",
          "Booking confirmation / voucher from Wheelio",
        ],
      },
      {
        heading: "Age and additional drivers",
        paragraphs: [
          "Minimum age is commonly 21–23 depending on category; young-driver surcharges may apply. Additional drivers usually need the same documents and may carry an extra fee shown at checkout.",
        ],
      },
      {
        heading: "Deposits vs rental total",
        paragraphs: [
          "Wheelio shows the mandatory rental total in TND separately from the refundable security deposit. The deposit is typically authorised or collected at the agency desk — it is not mixed into “total to pay now” without a label.",
        ],
      },
    ],
  },
  {
    slug: "tunis-carthage-airport-pickup",
    title: "Airport pickup at Tunis-Carthage",
    description:
      "How meet & greet and desk pickups work at Tunis-Carthage Airport (TUN).",
    readMinutes: 5,
    updated: "2026-05-20",
    intro:
      "Tunis-Carthage is the busiest rental pickup point on Wheelio. Agencies either staff a desk in arrivals or send a meet & greet agent with a name board. Knowing which method your offer uses reduces waiting time after landing.",
    midCta: {
      title: "Search Tunis-Carthage offers",
      body: "Filter by pickup method, transmission, and total price before you fly.",
    },
    sections: [
      {
        heading: "Meet & greet",
        paragraphs: [
          "After baggage claim, look for your agency representative in the arrivals hall. Share your flight number when booking so they can adjust for delays. Keep your confirmation QR or reference ready.",
        ],
      },
      {
        heading: "Airport desks",
        paragraphs: [
          "Some agencies operate partner desks inside the terminal. Follow signage for car rental / location de voitures. Queue times vary with summer peaks — instant-confirmation offers still require a short contract signing.",
        ],
      },
      {
        heading: "Practical tips",
        paragraphs: [
          "Save the agency phone from your booking page offline. Confirm whether the rate includes the airport surcharge (most Wheelio totals already include it when listed).",
        ],
        bullets: [
          "Photograph the car before leaving the lot",
          "Clarify fuel policy (full-to-full is common)",
          "Ask where to return keys if arriving after hours",
        ],
      },
    ],
  },
  {
    slug: "deposits-and-excess",
    title: "Understanding deposits and insurance excess",
    description:
      "How security deposits, basic CDW, and excess interact on Tunisian rental offers.",
    readMinutes: 7,
    updated: "2026-06-10",
    intro:
      "Two numbers matter on every Wheelio offer: the mandatory rental total and the security deposit. A third concept — insurance excess — explains how much you may owe if the car is damaged under the included cover.",
    midCta: {
      title: "Filter by deposit ceiling",
      body: "On search, lower the max deposit to match what your card can comfortably hold.",
    },
    sections: [
      {
        heading: "Security deposit",
        paragraphs: [
          "The deposit is a hold or temporary charge at pickup. It is refunded after return once the agency inspects the vehicle, minus any agreed charges. Amounts vary by category — luxury and vans typically require higher holds.",
        ],
      },
      {
        heading: "Excess (franchise)",
        paragraphs: [
          "Basic collision cover usually leaves an excess: the maximum you pay toward covered damage. Reducing excess via optional packages may be offered at the desk — treat those as agency products, not Wheelio fees.",
        ],
      },
      {
        heading: "What Wheelio shows",
        paragraphs: [
          "Listings keep deposit separate from total mandatory price so you can compare like-for-like. Always read the offer’s included cover notes before checkout.",
        ],
      },
    ],
  },
  {
    slug: "manual-vs-automatic-tunisia",
    title: "Manual vs automatic for Tunisia trips",
    description:
      "When to filter for automatic transmission on Tunisian roads and city traffic.",
    readMinutes: 4,
    updated: "2026-04-15",
    intro:
      "Manual gearboxes remain common in economy and some van fleets. Automatics are widely available in compact, intermediate, SUV, and luxury categories — and are worth filtering for if you rarely drive stick.",
    midCta: {
      title: "Browse automatic cars",
      body: "Jump to the automatic type page or search with transmission=automatic.",
    },
    sections: [
      {
        heading: "City and coastal driving",
        paragraphs: [
          "Tunis traffic and resort stop-start stretches favour automatics for many visitors. Manuals can be cheaper in TND totals — useful if you are comfortable with a clutch.",
        ],
      },
      {
        heading: "Availability",
        paragraphs: [
          "Summer diaspora demand depletes automatic stock first. Book early for airport pickups in July–August, or stay flexible on category (compact automatic vs economy manual).",
        ],
      },
      {
        heading: "How to filter on Wheelio",
        paragraphs: [
          "Use the Automatic type page or add transmission=automatic to your search URL. Confirmation type (instant vs request) still applies independently of gearbox.",
        ],
      },
    ],
  },
  {
    slug: "diaspora-summer-tips",
    title: "Diaspora summer rental tips",
    description:
      "Planning tips for peak-season family rentals when returning to Tunisia in summer.",
    readMinutes: 6,
    updated: "2026-05-01",
    intro:
      "July and August bring higher demand around Tunis, Hammamet, Sousse, and Djerba. Families often need larger boots, child seats, and flexible pickup — planning a few weeks ahead helps.",
    midCta: {
      title: "Compare summer dates early",
      body: "Lock in totals and deposit expectations before flights fill the airport queues.",
    },
    sections: [
      {
        heading: "Book categories that fit luggage",
        paragraphs: [
          "Intermediate and SUV classes handle soft bags better than economy hatches. Check seats and bags on each card — “or similar” means the model may swap within the same category.",
        ],
      },
      {
        heading: "Instant vs request",
        paragraphs: [
          "Instant confirmation helps when landing late. Request-to-book can still work if you allow time for agency acceptance — Wheelio labels both clearly.",
        ],
      },
      {
        heading: "Family extras",
        paragraphs: [
          "Child seats and additional drivers are often optional extras at checkout. Stock is limited in peak season — mention needs early in the booking notes when available.",
        ],
        bullets: [
          "Share flight numbers for meet & greet",
          "Photograph existing damage at pickup",
          "Confirm return time against iftar / evening traffic in Ramadan years",
        ],
      },
    ],
  },
]

export function getGuide(slug: string): GuideArticle | undefined {
  return GUIDES.find((g) => g.slug === slug)
}

export function listGuideSlugs(): string[] {
  return GUIDES.map((g) => g.slug)
}
