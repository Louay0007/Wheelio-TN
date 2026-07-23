export type FaqCategory =
  | "Booking"
  | "Prices & deposits"
  | "Documents & age"
  | "Pickup & return"
  | "Cancellation"
  | "Payments"

export type FaqItem = {
  id: string
  category: FaqCategory
  question: string
  answer: string
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  "Booking",
  "Prices & deposits",
  "Documents & age",
  "Pickup & return",
  "Cancellation",
  "Payments",
]

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "instant-vs-request",
    category: "Booking",
    question: "What is Instant booking vs Request to book?",
    answer:
      "Instant means the agency confirmed availability when you booked — you receive a voucher shortly after payment. Request to book sends your dates to the agency; they confirm or decline within the stated deadline (usually a few hours). Until confirmed, you are not charged the rental total in most cases — check the offer details before you submit.",
  },
  {
    id: "or-similar",
    category: "Booking",
    question: "What does “or similar” mean on a listing?",
    answer:
      "Some offers are category-based. You are guaranteed a car in that category (for example Economy or Compact), not always the exact model shown in the photo. The agency may assign a comparable vehicle with similar seats, bags, and transmission.",
  },
  {
    id: "different-return",
    category: "Booking",
    question: "Can I return the car to a different city?",
    answer:
      "Yes when the offer supports one-way hire. Use “return to a different location” in search. One-way fees, if any, are included in the total mandatory price shown before you book — not added as a surprise at the desk.",
  },
  {
    id: "total-price",
    category: "Prices & deposits",
    question: "What is included in the total price in TND?",
    answer:
      "The total mandatory price is what you must pay for the rental period shown: base rate, included mileage policy as stated, and mandatory fees the agency publishes. Optional extras (child seats, additional drivers, full cover upgrades) are listed separately. Currency on Wheelio is Tunisian dinar (TND).",
  },
  {
    id: "deposit-vs-rental",
    category: "Prices & deposits",
    question: "What is the difference between the rental price and the deposit?",
    answer:
      "The rental total is what you pay for using the car. The security / refundable deposit is a hold or cash amount the agency takes at pickup against damage, fuel, or fines. It is not mixed into “total to pay” on Wheelio without a clear deposit label. Deposits are usually released after the car is returned in good condition, per the agency’s timing.",
  },
  {
    id: "deposit-amount",
    category: "Prices & deposits",
    question: "How much deposit will I need?",
    answer:
      "Deposit amounts vary by agency, car category, and insurance package. Always check the “Refundable deposit” line on the offer and again on the booking voucher. Bring the payment method the agency requires (often a credit card in the driver’s name).",
  },
  {
    id: "documents",
    category: "Documents & age",
    question: "What documents do I need to pick up a car in Tunisia?",
    answer:
      "Typically: a valid driving licence held for the minimum period the agency states, passport or Tunisian ID, and the payment card for the deposit. International visitors should bring an International Driving Permit if their licence is not in Latin script or if the agency requests one. Exact rules are on each offer.",
  },
  {
    id: "minimum-age",
    category: "Documents & age",
    question: "What is the minimum driver age?",
    answer:
      "Most Tunisian agencies set a minimum around 21–23, with young-driver fees for drivers under 25. Luxury and larger categories often require a higher minimum age and longer licence tenure. Enter your real age in search so offers match agency rules.",
  },
  {
    id: "airport-pickup",
    category: "Pickup & return",
    question: "How does airport pickup work (Tunis-Carthage, Monastir, Enfidha, Djerba)?",
    answer:
      "Your voucher shows whether you go to a terminal desk, meet & greet in arrivals, or use an off-airport shuttle. Keep your flight number up to date so the agency can adjust for delays. After-hours pickups are only available when the offer says so — do not assume 24/7 desk cover.",
  },
  {
    id: "fuel-mileage",
    category: "Pickup & return",
    question: "What about fuel policy and mileage?",
    answer:
      "Common fuel policies are full-to-full or same-to-same — return with the same level you received, or you may be charged. Mileage may be limited or unlimited; over-mileage fees apply if you exceed a limited package. Both are stated on the offer before booking.",
  },
  {
    id: "car-unavailable",
    category: "Pickup & return",
    question: "What if the agency cannot provide the car?",
    answer:
      "Agencies must offer a suitable alternative in the same or higher category, or cancel with a refund according to the booking terms. Contact the agency using the details on your voucher first, then Wheelio support if you need help escalating.",
  },
  {
    id: "cancel-booking",
    category: "Cancellation",
    question: "How do I cancel a booking?",
    answer:
      "Open Manage booking from your confirmation email or help centre, or contact support with your booking reference. Free cancellation windows and fees depend on the offer — check the cancellation line before you pay. See our Cancellation policy for marketplace rules.",
  },
  {
    id: "refund-timing",
    category: "Cancellation",
    question: "When will I get a refund?",
    answer:
      "Approved refunds follow the payment method used at checkout. Card refunds typically take several business days after the agency or Wheelio confirms the cancellation. Deposit holds at pickup are handled by the agency, not by Wheelio’s rental charge.",
  },
  {
    id: "pay-online",
    category: "Payments",
    question: "Do I pay the full rental online?",
    answer:
      "It depends on the offer. Some bookings take a deposit or partial payment online with the balance due at the agency; others collect the full rental total at checkout. The price breakdown always shows what is due now versus at pickup.",
  },
  {
    id: "payment-methods",
    category: "Payments",
    question: "Which payment methods are accepted?",
    answer:
      "Online checkout supports the card methods shown at payment. At the desk, agencies often require a credit card for the security deposit even if you paid the rental online. Cash-only deposit policies are rare and must be stated on the offer.",
  },
  {
    id: "contract-language",
    category: "Payments",
    question: "In what language is the rental contract?",
    answer:
      "Agency contracts in Tunisia are commonly in French or Arabic, sometimes with an English summary. Ask the desk to explain key clauses (excess, fuel, mileage) before you sign. Wheelio’s booking summary remains available in English on your voucher.",
  },
]
