import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { CategoryIcon } from "@/components/icons/category-icons"
import { PageHero, PageShell } from "@/components/page-shell"
import { CAR_TYPES } from "@/lib/car-types"

export const metadata: Metadata = {
  title: "Car types | Wheelio TN",
  description:
    "Browse economy, compact, intermediate, SUV, van, luxury, and automatic rental cars across Tunisia. Compare totals in TND.",
}

export default function CarTypesIndexPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Browse by category"
        title="Car types for Tunisia trips"
        description="Pick a category that matches your luggage, passengers, and driving preference — then compare local agency offers in TND."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAR_TYPES.map((type) => (
            <li key={type.slug}>
              <Link
                href={`/cars/types/${type.slug}`}
                className="group flex h-full flex-col rounded-[8px] border border-black/10 p-5 transition hover:border-black/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:border-white/10 dark:hover:border-white/25 dark:focus-visible:outline-white"
              >
                <div className="flex size-16 items-center justify-center text-black dark:text-white">
                  {type.category ? (
                    <CategoryIcon category={type.category} className="h-10 w-14" />
                  ) : (
                    <span
                      className="flex h-10 w-14 items-center justify-center rounded-[6px] border border-black/15 text-[10px] font-semibold uppercase tracking-wider dark:border-white/20"
                      aria-hidden
                    >
                      Auto
                    </span>
                  )}
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">
                  {type.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-black/55 dark:text-white/55">
                  {type.blurb}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                  See cars
                  <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-black/10 pt-10 dark:border-white/10">
          <Link
            href="/search"
            className="inline-flex h-11 items-center justify-center rounded-[7px] bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Find a car
          </Link>
          <Link
            href="/guides/manual-vs-automatic-tunisia"
            className="inline-flex h-11 items-center justify-center rounded-[7px] border border-black/15 px-5 text-sm font-semibold transition hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/[0.04]"
          >
            Manual vs automatic guide
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
