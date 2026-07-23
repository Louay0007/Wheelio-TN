import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHero, PageShell } from "@/components/page-shell"
import { HelpfulFeedback } from "@/components/help/helpful-feedback"
import {
  getHelpArticle,
  getRelatedArticles,
  HELP_ARTICLES,
} from "@/lib/help-articles"

type Props = { params: Promise<{ article: string }> }

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ article: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { article: slug } = await params
  const article = getHelpArticle(slug)
  if (!article) return { title: "Help | Wheelio" }
  return {
    title: `${article.title} | Wheelio Help`,
    description: article.summary,
  }
}

export default async function HelpArticlePage({ params }: Props) {
  const { article: slug } = await params
  const article = getHelpArticle(slug)
  if (!article) notFound()

  const related = getRelatedArticles(article)
  const updated = new Date(article.updatedAt + "T12:00:00").toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  )

  return (
    <PageShell>
      <PageHero
        eyebrow={article.topic}
        title={article.title}
        description={`Updated ${updated}. ${article.summary}`}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="text-sm text-black/45 dark:text-white/45">
          <Link href="/help" className="hover:text-black dark:hover:text-white">
            Help centre
          </Link>
          <span className="mx-2">/</span>
          <span className="text-black/70 dark:text-white/70">{article.title}</span>
        </nav>

        <ol className="mt-10 space-y-0 border-t border-black/10 dark:border-white/10">
          {article.steps.map((step, i) => (
            <li
              key={step}
              className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 border-b border-black/10 py-6 dark:border-white/10"
            >
              <span className="text-sm font-semibold text-black/35 dark:text-white/35">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-[15px] leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 space-y-4 text-[15px] leading-relaxed text-black/65 dark:text-white/65">
          {article.body.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>

        {related.length > 0 ? (
          <aside className="mt-12 border-t border-black/10 pt-8 dark:border-white/10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              Related
            </h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/help/${r.slug}`}
                    className="text-base font-medium underline-offset-2 hover:underline"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className="mt-10">
          <HelpfulFeedback />
        </div>

        <p className="mt-8 text-sm text-black/55 dark:text-white/55">
          Still need help?{" "}
          <Link href="/contact" className="font-medium underline-offset-2 hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </PageShell>
  )
}
