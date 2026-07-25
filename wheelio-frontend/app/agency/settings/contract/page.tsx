"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import { PartnerContractPaper } from "@/components/partners/partner-contract-paper"
import { useAgencySession } from "@/lib/agency-session"
import { PARTNER_PRICING, recommendedCommissionExample } from "@/lib/partner-pricing"

export default function ContractSettingsPage() {
  const { workspace } = useAgencySession()
  const ex = recommendedCommissionExample()
  return (
    <AgencyShell
      title="Partner contract"
      description={`Tier ${workspace?.commissionTier} · ${workspace?.takeRatePercent ?? PARTNER_PRICING.recommendedPercent}% · example ${ex.agencyNetTnd} → ${ex.listedPriceTnd} TND`}
    >
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
        Launch {PARTNER_PRICING.launchPercent}% · Standard {PARTNER_PRICING.recommendedPercent}% · Volume {PARTNER_PRICING.volumePercent}%. Deposit excluded.
      </p>
      <PartnerContractPaper agencyName={workspace?.tradeName} />
      <Link href="/partners/join" className="mt-4 inline-flex text-sm underline">Public application form</Link>
    </AgencyShell>
  )
}
