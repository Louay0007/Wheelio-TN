export type LegalSection = {
  id: string
  title: string
  paragraphs: string[]
}

export type LegalDocument = {
  slug: string
  title: string
  description: string
  lastUpdated: string
  intro: string
  sections: LegalSection[]
}

const MARKETPLACE_NOTE =
  "Wheelio TN operates as an online marketplace intermediary. Local rental agencies supply the vehicles and perform the rental contract at pickup. Placeholder clauses below will be replaced with lawyer-reviewed Tunisia-specific wording before payments go live."

export const TERMS_DOC: LegalDocument = {
  slug: "terms",
  title: "Terms of service",
  description: "Terms governing use of the Wheelio TN car rental marketplace.",
  lastUpdated: "2026-07-01",
  intro: MARKETPLACE_NOTE,
  sections: [
    {
      id: "about-service",
      title: "1. About the service",
      paragraphs: [
        "Wheelio TN (“Wheelio”, “we”) provides a platform to search, compare, and request or book passenger car rentals offered by independent agencies in Tunisia.",
        "We do not own the rental fleet displayed on the site. The rental agreement for the vehicle is concluded between you and the agency, subject to the agency’s terms presented at booking and at pickup.",
      ],
    },
    {
      id: "eligibility",
      title: "2. Eligibility",
      paragraphs: [
        "You must be able to enter a binding contract and meet the minimum age and licence requirements of the selected agency.",
        "You agree to provide accurate driver, contact, and payment information. False details may lead to cancellation without refund where permitted by the applicable offer terms.",
      ],
    },
    {
      id: "bookings",
      title: "3. Bookings, Instant and Request",
      paragraphs: [
        "Instant bookings are confirmed when the agency’s inventory rules and payment authorisation succeed.",
        "Request to book submissions are offers to the agency. Confirmation occurs only when the agency accepts within the stated deadline. Until then, availability is not guaranteed.",
        "Prices are shown in Tunisian dinar (TND) unless otherwise stated. The total mandatory price and any refundable deposit are displayed separately.",
      ],
    },
    {
      id: "payments",
      title: "4. Payments and deposits",
      paragraphs: [
        "Online payments collected by Wheelio (or its payment provider) may cover a deposit, partial amount, or full rental total as shown at checkout. [Payment provider and merchant-of-record details — placeholder.]",
        "Security deposits at pickup are handled by the agency under their policy. Wheelio does not hold those desk deposits unless explicitly stated.",
      ],
    },
    {
      id: "cancellations",
      title: "5. Cancellations and no-shows",
      paragraphs: [
        "Cancellation rights depend on the offer you selected. See the Cancellation policy and the terms on your voucher.",
        "Failure to collect the vehicle without cancelling (no-show) may result in charges per the offer terms.",
      ],
    },
    {
      id: "liability",
      title: "6. Liability",
      paragraphs: [
        "Wheelio is responsible for operating the marketplace with reasonable care. Vehicle condition, roadside assistance, and traffic fines are primarily governed by your contract with the agency. [Liability cap and consumer rights under Tunisian law — placeholder for counsel.]",
        "Nothing in these terms limits rights that cannot be excluded under applicable consumer protection law.",
      ],
    },
    {
      id: "contact",
      title: "7. Contact",
      paragraphs: [
        "Questions about these terms: hello@wheelio.tn. Booking support: support@wheelio.tn. Postal address: Tunis, Tunisia — [full registered address placeholder].",
      ],
    },
  ],
}

export const PRIVACY_DOC: LegalDocument = {
  slug: "privacy",
  title: "Privacy policy",
  description: "How Wheelio TN collects and uses personal data.",
  lastUpdated: "2026-07-01",
  intro:
    "This policy explains what personal data we process when you use Wheelio TN. Final Tunisian data-protection wording (including any CNIL/INPDP references) will be completed with legal counsel. Marketplace intermediary note: agencies receive the driver data needed to fulfil your rental.",
  sections: [
    {
      id: "data-we-collect",
      title: "1. Data we collect",
      paragraphs: [
        "Identity and contact data: name, email, phone, and booking reference.",
        "Trip data: pickup and return locations, dates, times, driver age band, and vehicle preferences.",
        "Payment data: processed by our payment provider; we do not store full card numbers on Wheelio servers. [Provider name — placeholder.]",
        "Technical data: device, browser, approximate location from IP, and cookies as described in our Cookie policy.",
      ],
    },
    {
      id: "how-we-use",
      title: "2. How we use data",
      paragraphs: [
        "To create and manage bookings, send vouchers, and provide customer support.",
        "To share necessary booking details with the selected rental agency.",
        "To improve search quality, prevent fraud, and meet legal obligations.",
        "Marketing emails only with consent or where allowed by law; you can unsubscribe at any time.",
      ],
    },
    {
      id: "sharing",
      title: "3. Sharing",
      paragraphs: [
        "Agencies receive driver and trip details required to perform the rental.",
        "Processors (hosting, email, payments, analytics) act on our instructions. [Sub-processor list — placeholder.]",
        "We may disclose data when required by law or to protect rights and safety.",
      ],
    },
    {
      id: "retention",
      title: "4. Retention and security",
      paragraphs: [
        "Booking records are kept for the period needed for support, accounting, and legal claims. [Retention schedule — placeholder.]",
        "We apply appropriate technical and organisational measures; no method of transmission is perfectly secure.",
      ],
    },
    {
      id: "rights",
      title: "5. Your rights",
      paragraphs: [
        "Subject to applicable law, you may request access, correction, deletion, or restriction of your personal data, and object to certain processing.",
        "Contact privacy@wheelio.tn or support@wheelio.tn. You may also lodge a complaint with the competent supervisory authority in Tunisia. [Authority details — placeholder.]",
      ],
    },
  ],
}

export const COOKIES_DOC: LegalDocument = {
  slug: "cookies",
  title: "Cookie policy",
  description: "How Wheelio TN uses cookies and similar technologies.",
  lastUpdated: "2026-07-01",
  intro:
    "We use cookies and similar technologies to run the site, remember preferences such as theme, and understand aggregated traffic. Non-essential cookies will only be used with consent where required.",
  sections: [
    {
      id: "what-are-cookies",
      title: "1. What are cookies?",
      paragraphs: [
        "Cookies are small text files stored on your device. They can be session-based or persistent. Similar technologies include local storage and pixels.",
      ],
    },
    {
      id: "types",
      title: "2. Types we use",
      paragraphs: [
        "Strictly necessary: authentication of checkout sessions, security, load balancing, and storing your theme preference.",
        "Analytics: aggregated usage to improve search and content. [Analytics tool — placeholder; disabled until configured.]",
        "Functional: language preference when multi-language ships.",
        "Marketing: not used by default on the current marketplace MVP.",
      ],
    },
    {
      id: "manage",
      title: "3. Managing cookies",
      paragraphs: [
        "You can block or delete cookies in your browser settings. Blocking strictly necessary cookies may break booking flows.",
        "When a consent banner is enabled, you can update choices at any time from the footer cookie link. [Banner implementation — placeholder.]",
      ],
    },
    {
      id: "updates",
      title: "4. Updates",
      paragraphs: [
        "We may update this policy when our tools change. The last updated date appears at the top of this page.",
      ],
    },
  ],
}

export const CANCELLATION_DOC: LegalDocument = {
  slug: "cancellation-policy",
  title: "Cancellation policy",
  description: "How cancellations and refunds work on Wheelio TN.",
  lastUpdated: "2026-07-01",
  intro:
    "Cancellation rules are set per offer by the rental agency and shown before you book. This page explains how Wheelio handles cancellations as a marketplace intermediary. Lawyer-reviewed refund timelines will replace placeholders before card charging goes live.",
  sections: [
    {
      id: "before-you-book",
      title: "1. Before you book",
      paragraphs: [
        "Each offer shows whether cancellation is free until a deadline, partially refundable, or non-refundable.",
        "Instant and Request bookings both display their cancellation terms on the offer and again at checkout.",
      ],
    },
    {
      id: "how-to-cancel",
      title: "2. How to cancel",
      paragraphs: [
        "Use Manage booking from your confirmation email when available, or email support@wheelio.tn with your booking reference, full name, and pickup date.",
        "Support desk hours: Sunday–Thursday, 09:00–18:00 Tunisia time (UTC+1). We do not operate a 24/7 phone line. Urgent day-of-travel issues: contact the agency number on your voucher first, then email support.",
      ],
    },
    {
      id: "refunds",
      title: "3. Refunds",
      paragraphs: [
        "If your offer allows a free cancellation within the window, prepaid amounts collected by Wheelio are refunded to the original payment method after confirmation. Bank posting times vary.",
        "Outside free-cancellation windows, agency fees may apply as stated on the offer. [Fee schedule examples — placeholder.]",
        "Security deposit holds taken at the agency desk are released by the agency, not as a Wheelio rental refund.",
      ],
    },
    {
      id: "agency-cancels",
      title: "4. If the agency cancels",
      paragraphs: [
        "If the agency cannot supply the car and no acceptable alternative is agreed, you are entitled to a refund of amounts paid for that booking under the offer terms. We will help coordinate alternatives where possible.",
      ],
    },
    {
      id: "no-shows",
      title: "5. No-shows and amendments",
      paragraphs: [
        "Not collecting the vehicle without cancelling usually means prepaid amounts are kept per the offer.",
        "Date or name changes are not always free; request amendments through support or Manage booking as early as possible.",
      ],
    },
  ],
}

export const LEGAL_DOCS = [TERMS_DOC, PRIVACY_DOC, COOKIES_DOC, CANCELLATION_DOC] as const
