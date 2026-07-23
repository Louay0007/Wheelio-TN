import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import { getGuide, GUIDES, listGuideSlugs } from "@/lib/guides"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return listGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return { title: "Guide | Wheelio" }
  return {
    title: `${guide.title} | Wheelio TN`,
    description: guide.description,
  }
}

function SearchCta({ title, body }: { title: string; body: string }) {
  return (
    <aside className="my-10 rounded-[8px] border border-black/10 bg-black/[0.02] p-6 dark:border-white/10 dark:bg-white/[0.03]">
      <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-black/55 dark:text-white/55">{body}</p>
      <Link
        href="/search"
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-[7px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
      >
        Search cars
        <ArrowUpRight className="size-4" />
      </Link>
    </aside>
  )
}

export default async function GuideArticlePage({ params }: PageProps) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3)

  return (
    <PageShell>
      <PageHero
        eyebrow="Guide"
        title={guide.title}
        description={guide.description}
      />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs text-black/45 dark:text-white/45">
          {guide.readMinutes} min read · Updated {guide.updated}
        </p>
        <p className="mt-6 text-lg leading-relaxed text-black/70 dark:text-white/70">
          {guide.intro}
        </p>

        {guide.sections.map((section, index) => (
          <div key={section.heading}>
            {index === 1 ? (
              <SearchCta title={guide.midCta.title} body={guide.midCta.body} />
            ) : null}
            <h2 className="mt-10 text-xl font-semibold tracking-[-0.02em]">
              {section.heading}
            </h2>
            {section.paragraphs.map((p) => (
              <p
                key={p.slice(0, 40)}
                className="mt-3 text-base leading-relaxed text-black/65 dark:text-white/65"
              >
                {p}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-base text-black/65 dark:text-white/65">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}

        <SearchCta
          title="Ready to compare offers?"
          body="Browse Tunisian agencies with clear TND totals, deposits shown separately, and instant vs request labels."
        />

        <div className="border-t border-black/10 pt-8 dark:border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            More guides
          </p>
          <ul className="mt-4 space-y-2">
            {others.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  {g.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/guides"
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                All guides
              </Link>
            </li>
          </ul>
        </div>
      </article>
    </PageShell>
  )
}
