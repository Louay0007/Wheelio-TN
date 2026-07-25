import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "How it works | Wheelio",
  description:
    "Search Tunisian locations, compare total TND prices across agencies, book Instant or Request, then pick up with your voucher.",
}

const STEPS = [
  {
    n: "01",
    title: "Search locations and dates",
    body: "Choose a Tunisian airport or city, pickup and return times, and driver age. Prices are always shown in TND.",
  },
  {
    n: "02",
    title: "Compare totals and conditions",
    body: "Sort by total mandatory price — not just a daily headline. Check deposit, mileage, cancellation, and Instant vs Request on every offer.",
  },
  {
    n: "03",
    title: "Book instantly or send a request",
    body: "Instant means the agency confirmed availability when you paid. Request to book waits for the agency to accept within their deadline.",
  },
  {
    n: "04",
    title: "Get confirmation and voucher",
    body: "Your email voucher lists pickup instructions, amounts paid online vs due at the desk, deposit notes, and agency contacts.",
  },
  {
    n: "05",
    title: "Pick up with your documents",
    body: "Bring licence, ID/passport, and the card required for the security deposit. Inspect the car, then enjoy the trip.",
  },
]

export default function HowItWorksPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="How it works"
        title="Compare local agencies. Book with clear totals."
        description="Wheelio is a Tunisia car rental marketplace — we help you find and book cars from independent agencies. We do not own the fleet."
      />

      <section className="dark:border-white/10">
        <ol className="mx-auto max-w-7xl divide-y divide-black/10 px-4 dark:divide-white/10 sm:px-6">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="grid gap-4 py-10 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-10 sm:py-12"
            >
              <span className="text-sm font-semibold tracking-[0.12em] text-black/35 dark:text-white/35">
                {step.n}
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                  {step.title}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-black/55 dark:text-white/55">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="dark:border-white/10">
        <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:px-6 lg:grid-cols-2">
          <div className="py-10 lg:border-b-0 lg:border-r lg:pr-12 lg:py-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              Confirmation type
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              Instant vs Request to book
            </h2>
            <dl className="mt-6 space-y-5 text-[15px] leading-relaxed">
              <div>
                <dt className="font-medium">Instant</dt>
                <dd className="mt-1 text-black/55 dark:text-white/55">
                  The car is reserved when checkout succeeds. You receive a voucher and can plan pickup with confidence.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Request to book</dt>
                <dd className="mt-1 text-black/55 dark:text-white/55">
                  The agency reviews your dates and confirms or declines. Do not travel to pickup until status is Confirmed.
                </dd>
              </div>
            </dl>
          </div>
          <div className="py-10 lg:pl-12 lg:py-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              Money clarity
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
              Rental total vs security deposit
            </h2>
            <dl className="mt-6 space-y-5 text-[15px] leading-relaxed">
              <div>
                <dt className="font-medium">Rental total (TND)</dt>
                <dd className="mt-1 text-black/55 dark:text-white/55">
                  What you pay for the hire period — the mandatory price we emphasise on every offer and at checkout.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Refundable deposit</dt>
                <dd className="mt-1 text-black/55 dark:text-white/55">
                  A separate hold or cash amount at pickup against damage, fuel, or fines. Never mixed into “total to pay” without a deposit label.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Ready to compare cars?
        </h2>
        <p className="mt-3 max-w-lg text-base text-black/55 dark:text-white/55">
          Search Tunisian airports and cities with clear totals in TND.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/#search"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[7px] bg-black px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Find a car
            <ArrowUpRight className="size-4" />
          </Link>
          <Link
            href="/faq"
            className="inline-flex h-12 items-center justify-center rounded-[7px] border border-black/25 px-6 text-sm font-semibold transition hover:bg-black/5 dark:border-white/25 dark:hover:bg-white/5"
          >
            Read FAQ
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
