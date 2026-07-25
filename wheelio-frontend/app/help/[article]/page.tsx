import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHero, PageShell } from "@/components/page-shell"
import { HelpfulFeedback } from "@/components/help/helpful-feedback"
import {
  helpArticleSchema,
  parseStructuredContent,
} from "@/lib/contracts/content"
import { getRequestLocale } from "@/lib/i18n/server"
import {
  getTypedContent,
  listTypedContent,
} from "@/server/modules/reviews-content/application/get-typed-content"

type Props = {
  params: Promise<{ article: string }>
  searchParams: Promise<{ locale?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { article: slug } = await params
  try {
    const content = await getTypedContent("help", slug, "en")
    const article = parseStructuredContent(content, helpArticleSchema)
    return {
      title: `${article.title} | Wheelio Help`,
      description: article.summary,
    }
  } catch {
    return { title: "Help | Wheelio" }
  }
}

export default async function HelpArticlePage({ params, searchParams }: Props) {
  const { article: slug } = await params
  const locale = await getRequestLocale((await searchParams).locale)
  let contentPayload
  try {
    contentPayload = await Promise.all([
      getTypedContent("help", slug, locale),
      listTypedContent("help", locale),
    ])
  } catch {
    notFound()
  }
  const [content, allContent] = contentPayload
  const article = parseStructuredContent(content, helpArticleSchema)
  const allArticles = allContent.map((item) =>
    parseStructuredContent(item, helpArticleSchema),
  )
  const relatedBySlug = new Map(
    allArticles.map((relatedArticle) => [relatedArticle.slug, relatedArticle]),
  )
  const related = article.relatedSlugs.flatMap((relatedSlug) => {
    const relatedArticle = relatedBySlug.get(relatedSlug)
    return relatedArticle ? [relatedArticle] : []
  })
  const updated = new Date(article.updatedAt + "T12:00:00").toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-GB",
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
          <Link href={`/help?locale=${locale}`} className="hover:text-black dark:hover:text-white">
            Help centre
          </Link>
          <span className="mx-2">/</span>
          <span className="text-black/70 dark:text-white/70">{article.title}</span>
        </nav>

        <ol className="mt-10 space-y-0 dark:border-white/10">
          {article.steps.map((step, i) => (
            <li
              key={step}
              className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 py-6 dark:border-white/10"
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
          <aside className="mt-12 pt-8 dark:border-white/10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              Related
            </h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/help/${r.slug}?locale=${locale}`}
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
