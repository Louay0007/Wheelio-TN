"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * Stage 6: when an API slice is on but this page has no gateway wiring yet,
 * show an explicit empty state instead of a demo workspace shell that looks live.
 */
export function ApiNotWiredEmpty({
  surface,
  slice,
  backHref,
  className,
}: {
  surface: string
  slice: "agency" | "admin" | "checkout" | "catalog" | "auth"
  backHref?: string
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-[12px] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center dark:border-zinc-600 dark:bg-zinc-950",
        className,
      )}
    >
      <p className="text-lg font-semibold tracking-[-0.02em]">
        API not wired for {surface}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        The <code className="font-mono text-xs">{slice}</code> API slice is
        enabled. Demo workspace data is not authoritative here — use a wired
        surface or finish this vertical slice.
      </p>
      {backHref ? (
        <Link
          href={backHref}
          className="mt-5 inline-flex h-10 items-center rounded-[8px] border border-zinc-300 px-4 text-sm font-semibold dark:border-zinc-600"
        >
          Back
        </Link>
      ) : null}
    </div>
  )
}
