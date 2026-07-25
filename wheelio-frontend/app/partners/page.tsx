import type { Metadata } from "next"
import Link from "next/link"
import { PageHero, PageShell } from "@/components/page-shell"
import { PARTNER_PRICING, recommendedCommissionExample } from "@/lib/partner-pricing"

export const metadata: Metadata = {
  title: "Partners | Wheelio TN",
  description: "List your Tunisian rental fleet on Wheelio. Standard commission 12%.",
}

export default function PartnersPitchPage() {
  const ex = recommendedCommissionExample()
  return (
    <PageShell>
      <PageHero
        eyebrow="Partners"
        title="List your fleet on Wheelio"
        description="One marketplace for Tunisian agencies. You set the net; travellers see one honest listed total."
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link
          href="/partners/join"
          className="inline-flex h-12 cursor-pointer items-center rounded-[8px] bg-black px-6 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          Start partner application
        </Link>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Apply", "Verify", "List", "Get bookings"].map((step, i) => (
            <li key={step} className="rounded-[12px] border border-black/15 p-4 dark:border-white/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45">Step {i + 1}</p>
              <p className="mt-2 text-lg font-semibold">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-[12px] border border-black/15 p-6 dark:border-white/15">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Commission</h2>
          <p className="mt-2 max-w-2xl text-sm text-black/60">
            Standard {PARTNER_PRICING.recommendedPercent}% of the customer trip total. Launch / volume {PARTNER_PRICING.launchPercent}%.
            Deposit never included. Example: net {ex.agencyNetTnd} TND → listed {ex.listedPriceTnd} TND.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Requirements</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-black/65">
            <li>Valid commercial rental registration</li>
            <li>Insured fleet + photos</li>
            <li>Desk hours and pickup methods</li>
            <li>Bank details for payouts</li>
          </ul>
        </div>

        <p className="mt-10 text-sm">
          Questions?{" "}
          <Link href="/partners/faq" className="underline">
            Partner FAQ
          </Link>{" "}
          ·{" "}
          <a href="mailto:partners@wheelio.tn" className="underline">
            partners@wheelio.tn
          </a>
        </p>
      </section>
    </PageShell>
  )
}
