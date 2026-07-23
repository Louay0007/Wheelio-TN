import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Mail, MapPin } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "About Wheelio TN",
  description:
    "Wheelio is a Tunisia-first multi-agency car rental marketplace — compare local agencies, clear TND totals, reliable booking.",
}

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About"
        title="A marketplace for Tunisia car rental"
        description="Wheelio helps travellers compare trusted local agencies — we do not own the fleet. Clear TND totals, separate deposits, and honest confirmation labels."
      />

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Mission</h2>
        <p className="mt-3 text-base leading-relaxed text-black/65 dark:text-white/65">
          Make renting a car in Tunisia as transparent as booking a flight: one search, multiple
          agencies, mandatory prices in Tunisian dinar, and policies you can read before you commit.
        </p>

        <h2 className="mt-12 text-xl font-semibold tracking-[-0.02em]">How supply works</h2>
        <p className="mt-3 text-base leading-relaxed text-black/65 dark:text-white/65">
          Independent rental agencies list availability and conditions on Wheelio. When you book, the
          agency fulfils the rental under their contract. We normalise key fields — total price,
          deposit, mileage, cancellation, and confirmation type — so you can compare like-for-like.
        </p>

        <h2 className="mt-12 text-xl font-semibold tracking-[-0.02em]">Trust & verification</h2>
        <p className="mt-3 text-base leading-relaxed text-black/65 dark:text-white/65">
          Listed partners have business documents reviewed for marketplace onboarding. That review is
          not a government certification or a guarantee of every trip outcome. Ratings and reviews
          help you decide; always read the offer page before checkout.
        </p>

        <h2 className="mt-12 text-xl font-semibold tracking-[-0.02em]">Contact</h2>
        <ul className="mt-4 space-y-3 text-sm text-black/65 dark:text-white/65">
          <li className="flex items-center gap-2">
            <Mail className="size-4 shrink-0" />
            <a
              href="mailto:hello@wheelio.tn"
              className="underline-offset-4 hover:underline"
            >
              hello@wheelio.tn
            </a>
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            Tunis, Tunisia
          </li>
        </ul>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-black/10 pt-10 dark:border-white/10">
          <Link
            href="/search"
            className="inline-flex h-11 items-center gap-2 rounded-[7px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Find a car
            <ArrowUpRight className="size-4" />
          </Link>
          <a
            href="mailto:partners@wheelio.tn"
            className="inline-flex h-11 items-center gap-2 rounded-[7px] border border-black/15 px-5 text-sm font-semibold dark:border-white/15"
          >
            List your agency
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </section>
    </PageShell>
  )
}
