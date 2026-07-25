import type { Metadata } from "next"
import {
  PARTNER_PRICING,
  recommendedCommissionExample,
} from "@/lib/partner-pricing"
import { PartnerJoinForm } from "@/components/partners/partner-join-form"

const example = recommendedCommissionExample()

export const metadata: Metadata = {
  title: "List your agency | Wheelio TN Partners",
  description: `Join Wheelio TN as a rental partner. Standard commission ${PARTNER_PRICING.recommendedPercent}% of the customer trip total (deposit excluded). Example: ${example.agencyNetTnd} TND net → ${example.listedPriceTnd} TND listed.`,
}

export default function PartnerJoinPage() {
  return <PartnerJoinForm />
}
