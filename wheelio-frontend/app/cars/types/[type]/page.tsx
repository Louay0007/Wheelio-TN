import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { CategoryIcon } from "@/components/icons/category-icons"
import { PageHero, PageShell } from "@/components/page-shell"
import {
  getCarType,
  listCarTypeSlugs,
  searchHrefForType,
  type CarTypeSlug,
} from "@/lib/car-types"

type PageProps = {
  params: Promise<{ type: string }>
}

export function generateStaticParams() {
  return listCarTypeSlugs().map((type) => ({ type }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type: slug } = await params
  const type = getCarType(slug)
  if (!type) return { title: "Car type | Wheelio" }
  return {
    title: `${type.title} | Wheelio TN`,
    description: type.blurb,
  }
}

export default async function CarTypeDetailPage({ params }: PageProps) {
  const { type: slug } = await params
  const type = getCarType(slug)
  if (!type) notFound()

  const others = listCarTypeSlugs().filter((s) => s !== type.slug) as CarTypeSlug[]

  return (
    <PageShell>
      <PageHero
        eyebrow="Car type"
        title={type.title}
        description={type.blurb}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="mb-8 flex size-20 items-center justify-center rounded-[8px] border border-black/10 dark:border-white/10">
              {type.category ? (
                <CategoryIcon category={type.category} className="h-12 w-16" />
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Automatic
                </span>
              )}
            </div>

            <h2 className="text-xl font-semibold tracking-[-0.02em]">Who it&apos;s for</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-black/60 dark:text-white/60">
              {type.whoFor}
            </p>

            {type.slug === "automatic" ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-black/60 dark:text-white/60">
                This page filters by{" "}
                <strong className="font-semibold text-black dark:text-white">
                  transmission
                </strong>
                , not vehicle size. You can still choose economy through luxury once you land on
                search results.
              </p>
            ) : null}

            <h2 className="mt-10 text-xl font-semibold tracking-[-0.02em]">Typical use</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-black/60 dark:text-white/60">
              {type.typicalUse.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={searchHrefForType(type)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                See cars
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/cars/types"
                className="inline-flex h-11 items-center justify-center rounded-[7px] border border-black/15 px-5 text-sm font-semibold transition hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/[0.04]"
              >
                All types
              </Link>
            </div>
          </div>

          <aside className="rounded-[8px] border border-black/10 p-5 dark:border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              Other types
            </p>
            <ul className="mt-4 space-y-2">
              {others.map((s) => {
                const t = getCarType(s)!
                return (
                  <li key={s}>
                    <Link
                      href={`/cars/types/${s}`}
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {t.shortLabel}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      </section>
    </PageShell>
  )
}
