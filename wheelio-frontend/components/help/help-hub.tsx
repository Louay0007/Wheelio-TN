"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import {
  helpArticleSchema,
  parseStructuredContent,
} from "@/lib/contracts/content"
import type { AppLocaleDto } from "@/lib/contracts/common"
import type { CmsContent } from "@/lib/contracts/public-catalog"
import { useCmsCollection } from "@/lib/query/public-catalog"

export function HelpHubClient({
  locale,
  initialData,
}: {
  locale: AppLocaleDto
  initialData: CmsContent[]
}) {
  const [query, setQuery] = useState("")
  const [topic, setTopic] = useState("All")
  const content = useCmsCollection("help", locale, initialData)
  const allArticles = useMemo(
    () =>
      (content.data ?? []).map((item) =>
        parseStructuredContent(item, helpArticleSchema),
      ),
    [content.data],
  )
  const topics = useMemo(
    () => [...new Set(allArticles.map((article) => article.topic))],
    [allArticles],
  )

  const articles = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allArticles.filter((a) => {
      if (topic !== "All" && a.topic !== topic) return false
      if (!q) return true
      return (
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.topic.toLowerCase().includes(q)
      )
    })
  }, [allArticles, query, topic])

  return (
    <div className="space-y-10">
      <label className="block max-w-xl">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
          Search help articles
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Booking, deposit, airport pickup…"
          className="mt-2 h-11 w-full rounded-[7px] border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-black dark:border-white/15 dark:bg-zinc-900 dark:focus:border-white"
        />
      </label>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
          Topics
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <button
              type="button"
              onClick={() => setTopic("All")}
              className={topicTileClass(topic === "All")}
            >
              All topics
              <span className="mt-1 block text-sm font-normal text-black/45 dark:text-white/45">
                {allArticles.length} articles
              </span>
            </button>
          </li>
          {topics.map((t) => {
            const count = allArticles.filter((a) => a.topic === t).length
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setTopic(t)}
                  className={topicTileClass(topic === t)}
                >
                  {t}
                  <span className="mt-1 block text-sm font-normal text-black/45 dark:text-white/45">
                    {count} article{count === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <h2 className="pb-3 text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
          Articles
        </h2>
        {articles.length === 0 ? (
          <p className="py-8 text-sm text-black/55 dark:text-white/55">
            No articles match. Try{" "}
            <Link href="/faq" className="underline-offset-2 hover:underline">
              FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="underline-offset-2 hover:underline">
              contact us
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/help/${article.slug}?locale=${locale}`}
                  className="group flex items-start justify-between gap-4 py-5 transition"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
                      {article.topic}
                    </p>
                    <p className="mt-1 text-lg font-medium tracking-[-0.02em] group-hover:underline">
                      {article.title}
                    </p>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-black/55 dark:text-white/55">
                      {article.summary}
                    </p>
                  </div>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-black/35 transition group-hover:text-black dark:text-white/35 dark:group-hover:text-white" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function topicTileClass(active: boolean) {
  return active
    ? "w-full rounded-[8px] border border-black bg-black px-4 py-4 text-left text-base font-medium text-white dark:border-white dark:bg-white dark:text-black"
    : "w-full rounded-[8px] border border-black/12 px-4 py-4 text-left text-base font-medium transition hover:border-black/35 dark:border-white/12 dark:hover:border-white/35"
}
