"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  faqItemSchema,
  parseStructuredContent,
  type FaqContentItem,
} from "@/lib/contracts/content"
import type { AppLocaleDto } from "@/lib/contracts/common"
import type { CmsContent } from "@/lib/contracts/public-catalog"
import { useCmsCollection } from "@/lib/query/public-catalog"

export function FaqClient({
  locale,
  initialData,
}: {
  locale: AppLocaleDto
  initialData: CmsContent[]
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const content = useCmsCollection("faq", locale, initialData)
  const items = useMemo(
    () =>
      (content.data ?? []).map((item) =>
        parseStructuredContent(item, faqItemSchema),
      ),
    [content.data],
  )
  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))],
    [items],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (category !== "All" && item.category !== category) return false
      if (!q) return true
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
    })
  }, [items, query, category])

  const grouped = useMemo(() => {
    const map = new Map<string, FaqContentItem[]>()
    for (const item of filtered) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return categories.map((cat) => ({
      category: cat,
      items: map.get(cat) ?? [],
    })).filter((g) => g.items.length > 0)
  }, [categories, filtered])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block max-w-md flex-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            Search questions
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. deposit, airport, age…"
            className="mt-2 h-11 w-full rounded-[7px] border border-black/15 bg-white px-3 text-sm text-black outline-none transition focus:border-black dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          />
        </label>
        <p className="text-sm text-black/45 dark:text-white/45">
          Need more help?{" "}
          <Link href="/help" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">
            Help centre
          </Link>
          {" · "}
          <Link href="/contact" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">
            Contact
          </Link>
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="FAQ categories">
        <CategoryChip
          active={category === "All"}
          onClick={() => setCategory("All")}
          label="All"
        />
        {categories.map((cat) => (
          <CategoryChip
            key={cat}
            active={category === cat}
            onClick={() => setCategory(cat)}
            label={cat}
          />
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="py-10 text-sm text-black/55 dark:text-white/55">
          No questions match “{query}”. Try another term or{" "}
          <Link href="/contact" className="underline-offset-2 hover:underline">
            contact support
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-12">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="pb-3 text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
                {group.category}
              </h2>
              <Accordion type="multiple" className="w-full">
                {group.items.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="border-black/10"
                  >
                    <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-[15px] leading-relaxed text-black/65 dark:text-white/65">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "rounded-[7px] bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          : "rounded-[7px] border border-black/15 px-3 py-2 text-sm text-black/65 transition hover:border-black/40 dark:border-white/15 dark:text-white/65 dark:hover:border-white/40"
      }
    >
      {label}
    </button>
  )
}
