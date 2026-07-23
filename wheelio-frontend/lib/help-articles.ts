export type HelpTopic =
  | "Booking"
  | "Pickup problems"
  | "Refunds & cancellation"
  | "Documents"
  | "Payments"
  | "Account"

export type HelpArticle = {
  slug: string
  title: string
  topic: HelpTopic
  summary: string
  updatedAt: string
  steps: string[]
  body: string[]
  relatedSlugs: string[]
}

export const HELP_TOPICS: HelpTopic[] = [
  "Booking",
  "Pickup problems",
  "Refunds & cancellation",
  "Documents",
  "Payments",
  "Account",
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "how-to-book",
    title: "How to book a rental car on Wheelio",
    topic: "Booking",
    summary: "Search Tunisian locations, compare totals in TND, then Instant book or Request to book.",
    updatedAt: "2026-07-01",
    steps: [
      "Enter pickup location, dates, times, and driver age on the home search or /search.",
      "Compare offers: total mandatory price, deposit, Instant vs Request, cancellation, and mileage.",
      "Open an offer to review the full breakdown and agency policies.",
      "Continue to checkout, enter driver details, and confirm. Save your voucher and booking reference.",
    ],
    body: [
      "Wheelio is a marketplace. You compare cars from local Tunisian agencies; the agency supplies the vehicle.",
      "Always read Instant vs Request carefully. Instant bookings are confirmed when payment succeeds. Requests wait for agency approval.",
    ],
    relatedSlugs: ["instant-vs-request", "reading-your-voucher"],
  },
  {
    slug: "instant-vs-request",
    title: "Instant confirmation vs Request to book",
    topic: "Booking",
    summary: "Know whether your car is reserved now or waiting on the agency.",
    updatedAt: "2026-07-01",
    steps: [
      "Look for the Instant or Request to book badge on the offer card.",
      "If Instant, complete checkout and wait for the voucher email.",
      "If Request, submit the request and watch for confirmation or decline within the stated deadline.",
      "Do not travel to pickup until the booking status is Confirmed.",
    ],
    body: [
      "Request-to-book helps agencies protect limited fleet. You are not guaranteed the car until they accept.",
      "If a request is declined, you can search again for another agency or date.",
    ],
    relatedSlugs: ["how-to-book", "cancel-a-booking"],
  },
  {
    slug: "airport-pickup-tips",
    title: "Airport pickup: desks, meet & greet, and delays",
    topic: "Pickup problems",
    summary: "What to expect at Tunis-Carthage, Monastir, Enfidha, and Djerba.",
    updatedAt: "2026-07-01",
    steps: [
      "Open your voucher and note the pickup method and meeting point.",
      "Add or update your flight number in Manage booking if the agency allows it.",
      "After landing, follow the voucher instructions before calling support.",
      "If nobody is present after a reasonable wait, contact the agency number on the voucher, then Wheelio support.",
    ],
    body: [
      "Airport desks are not always open overnight. After-hours service only applies when the offer says so.",
      "Meet & greet partners often wait in arrivals with a name board. Have your booking reference ready.",
    ],
    relatedSlugs: ["reading-your-voucher", "documents-at-pickup"],
  },
  {
    slug: "documents-at-pickup",
    title: "Documents you need at pickup",
    topic: "Documents",
    summary: "Licence, ID, and the card used for the deposit.",
    updatedAt: "2026-06-15",
    steps: [
      "Bring your physical driving licence (and IDP if required by the agency).",
      "Bring passport or Tunisian national ID matching the lead driver name.",
      "Bring the credit/debit card the agency requires for the security deposit.",
      "Show the voucher (PDF or email) with booking reference.",
    ],
    body: [
      "The lead driver named on the booking must usually be present. Additional drivers need their own licences and may incur fees.",
      "If your licence is not in Latin characters, an International Driving Permit is strongly recommended.",
    ],
    relatedSlugs: ["airport-pickup-tips", "understanding-deposits"],
  },
  {
    slug: "understanding-deposits",
    title: "Understanding security deposits",
    topic: "Payments",
    summary: "Deposit holds are separate from the rental total in TND.",
    updatedAt: "2026-07-01",
    steps: [
      "Check the refundable deposit amount on the offer before booking.",
      "At pickup, the agency places a hold or takes a cash deposit as stated.",
      "Inspect the car and note existing damage on the check-out form.",
      "After return, the agency releases the hold according to their timeline (often several days).",
    ],
    body: [
      "Wheelio shows deposit separately so it is never confused with the rental total you pay for the hire itself.",
      "Deposit disputes should start with the agency; Wheelio can help if you share photos and the check-in report.",
    ],
    relatedSlugs: ["cancel-a-booking", "documents-at-pickup"],
  },
  {
    slug: "cancel-a-booking",
    title: "How to cancel and what refunds look like",
    topic: "Refunds & cancellation",
    summary: "Follow the offer’s free-cancellation window, then request a refund.",
    updatedAt: "2026-07-01",
    steps: [
      "Find your booking reference in the confirmation email.",
      "Open Manage booking or contact support@wheelio.tn with the reference.",
      "Confirm the cancellation policy that applied to your offer (free until date/time, or fee).",
      "Keep the cancellation confirmation until the refund appears on your statement.",
    ],
    body: [
      "Refund timing depends on your bank. Wheelio and the agency confirm the amount first; the card network then settles.",
      "No-shows without cancellation usually forfeit prepaid amounts per the offer terms.",
    ],
    relatedSlugs: ["how-to-book", "understanding-deposits"],
  },
  {
    slug: "reading-your-voucher",
    title: "Reading your booking voucher",
    topic: "Booking",
    summary: "Pickup point, totals, deposit, and who to call.",
    updatedAt: "2026-06-20",
    steps: [
      "Confirm dates, times, and pickup / return locations.",
      "Note Instant vs confirmed Request status.",
      "Check total paid online vs amount due at the agency.",
      "Save agency phone and emergency contact from the voucher.",
    ],
    body: [
      "Your voucher is the source of truth for pickup instructions. Screenshots of search results are not enough at the desk.",
      "Guest checkout still produces a full voucher by email — you do not need an account to travel.",
    ],
    relatedSlugs: ["how-to-book", "airport-pickup-tips"],
  },
]

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug)
}

export function getRelatedArticles(article: HelpArticle): HelpArticle[] {
  return article.relatedSlugs
    .map((slug) => getHelpArticle(slug))
    .filter((a): a is HelpArticle => Boolean(a))
}
