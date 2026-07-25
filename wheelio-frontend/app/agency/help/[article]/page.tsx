"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AgencyShell } from "@/components/agency/agency-shell"

export default function AgencyHelpArticlePage() {
  const { article } = useParams<{ article: string }>()
  const title = article.replaceAll("-", " ")
  return (
    <AgencyShell title={title} description="Short ops article with screenshot placeholders.">
      <article className="prose prose-sm max-w-2xl dark:prose-invert">
        <p>
          Demo help content for <strong>{title}</strong>. In production this comes from the partner success wiki.
        </p>
        <div className="my-6 flex h-40 items-center justify-center rounded-[10px] border border-dashed border-zinc-300 dark:border-zinc-600 text-sm text-zinc-500 dark:text-zinc-400">
          Screenshot placeholder
        </div>
        <p>Remember: deposit is never in commission. Desk hours honesty - no fake 24/7.</p>
      </article>
      <Link href="/agency/help" className="mt-6 inline-flex text-sm underline">All articles</Link>
    </AgencyShell>
  )
}
