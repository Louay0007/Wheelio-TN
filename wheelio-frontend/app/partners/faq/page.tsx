import type { Metadata } from "next"
import Link from "next/link"
import { PageHero, PageShell } from "@/components/page-shell"

export const metadata: Metadata = { title: "Partner FAQ | Wheelio TN" }

const FAQ = [
  ["What is the commission?", "Standard 12% of the customer trip total. Deposit is separate and never commissioned."],
  ["Do I need Instant booking?", "No. New partners start on request-to-book and can unlock Instant after quality gates."],
  ["Who holds the deposit?", "You — at the desk. Wheelio shows it separately to travellers."],
  ["How do payouts work?", "Wheelio remits net (listed − commission − refunds) on the payout schedule in the portal."],
]

export default function PartnersFaqPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Partners" title="Partner FAQ" description="Honest desk-ops answers." />
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        {FAQ.map(([q, a]) => (
          <div key={q} className="rounded-[12px] border border-black/15 p-5 dark:border-white/15">
            <h2 className="font-semibold">{q}</h2>
            <p className="mt-2 text-sm text-black/60">{a}</p>
          </div>
        ))}
        <Link href="/partners/join" className="inline-flex h-11 items-center rounded-[8px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black">
          Apply now
        </Link>
      </section>
    </PageShell>
  )
}
