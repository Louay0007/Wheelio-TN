import {
  PARTNER_PRICING,
  recommendedCommissionExample,
} from "@/lib/partner-pricing"

export type PartnerContractArticle = {
  number: string
  titleEn: string
  titleFr: string
  body: string
}

/** Default commission illustration — recommended 12% marketplace take rate. */
export const PARTNER_COMMISSION_EXAMPLE = recommendedCommissionExample()

export function partnerCommissionArticles(
  agencyName = "the Partner Agency",
): PartnerContractArticle[] {
  const { agencyNetTnd, listedPriceTnd, wheelioFeeTnd, wheelioFeePercent } =
    PARTNER_COMMISSION_EXAMPLE

  return [
    {
      number: "1",
      titleEn: "Parties",
      titleFr: "Parties",
      body: `This Partner Marketplace Agreement is between Wheelio TN (marketplace intermediary, “Wheelio”) and ${agencyName} (the “Partner Agency”). Wheelio does not own the Partner’s vehicles. The Partner remains the lessor under Tunisian rental practice and issues physical rental papers at pickup.`,
    },
    {
      number: "2",
      titleEn: "Purpose",
      titleFr: "Objet",
      body: "Wheelio lists the Partner’s fleet to travellers, collects booking requests and (when enabled) online deposits, and routes confirmed trips to the Partner desk. The Partner supplies the vehicle, holds the security deposit at pickup, and completes handover.",
    },
    {
      number: "3",
      titleEn: "Commission and customer price",
      titleFr: "Commission et prix client",
      body: `The Partner sets the agency net rate (what the Partner expects to receive for the rental period). Wheelio publishes a customer-facing mandatory total that includes Wheelio’s marketplace fee. Standard take rate: ${wheelioFeePercent}% of the customer trip total (refundable deposit excluded). Worked example for one day: Partner net ${agencyNetTnd} TND → listed ${listedPriceTnd} TND → Wheelio commission ${wheelioFeeTnd} TND. Formula: listed = net ÷ (1 − ${wheelioFeePercent / 100}). Launch partners may receive ${PARTNER_PRICING.launchPercent}% for a limited onboarding window; high-volume partners may negotiate ${PARTNER_PRICING.volumePercent}% after sustained volume. Security / refundable deposits are never mixed into this commission math — deposits stay with the Partner at pickup.`,
    },
    {
      number: "4",
      titleEn: "Pricing honesty",
      titleFr: "Transparence tarifaire",
      body: "Mandatory trip totals shown to customers must match what the Partner will honour at the desk, excluding the separately labelled refundable deposit. The Partner will not add undisclosed desk fees that contradict the Wheelio quote, except taxes or extras the customer explicitly accepts.",
    },
    {
      number: "5",
      titleEn: "Listings and availability",
      titleFr: "Annonces et disponibilite",
      body: "The Partner keeps calendar availability accurate. Instant-confirmation listings must be honourable within stated desk hours. Request-to-book listings must receive a response within the published SLA (demo default: six desk hours).",
    },
    {
      number: "6",
      titleEn: "Payouts",
      titleFr: "Paiements",
      body: "When Wheelio collects an online deposit or full rental on behalf of the marketplace, Wheelio remits the Partner’s net (listed customer total minus agreed commission and any refunds) according to the payout schedule in the Partner dashboard. Cash paid at the desk for the rental balance remains with the Partner; Wheelio invoice for commission may still apply on those bookings as configured.",
    },
    {
      number: "7",
      titleEn: "Cancellations and no-shows",
      titleFr: "Annulations et non-presentation",
      body: "Customer cancellations follow the policy attached to each listing. Wheelio refunds amounts it collected according to that policy. Partner-initiated cancellations after confirmation may trigger make-good obligations or reduced ranking.",
    },
    {
      number: "8",
      titleEn: "Documents and compliance",
      titleFr: "Documents et conformite",
      body: "The Partner warrants it holds valid commercial rental authorisations for Tunisia, insured fleet, and competent staff. Wheelio may request copies for verification and may suspend listings if documents expire or complaints indicate material risk.",
    },
    {
      number: "9",
      titleEn: "Brand and communication",
      titleFr: "Marque et communication",
      body: "Customers book through Wheelio. The Partner may contact the customer after confirmation for operational details (flight, pickup point) using the channel shown in the booking. The Partner will not solicit the customer to bypass Wheelio for the same dates.",
    },
    {
      number: "10",
      titleEn: "Term and termination",
      titleFr: "Duree et resiliation",
      body: "Either party may end this agreement with written notice subject to honouring confirmed bookings already accepted. Wheelio may suspend immediately for fraud, safety, or repeated policy breaches.",
    },
    {
      number: "11",
      titleEn: "Electronic acceptance",
      titleFr: "Acceptation electronique",
      body: "Checking “I agree” and submitting the partner application constitutes electronic acceptance of this agreement for onboarding purposes. A countersigned PDF may follow after Wheelio verifies the Partner’s documents. Demo applications are not legally binding until Wheelio activates the live Partner account.",
    },
  ]
}

export type PartnerApplicationDraft = {
  legalName: string
  tradeName: string
  taxId: string
  contactName: string
  email: string
  phone: string
  city: string
  address: string
  fleetSize: string
  pickupMethods: string[]
  website: string
  iban: string
  password: string
}
