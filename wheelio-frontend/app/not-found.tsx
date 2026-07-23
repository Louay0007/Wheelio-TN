import Link from "next/link"
import { Home, Search } from "lucide-react"
import { PageShell } from "@/components/page-shell"

export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
          404
        </p>
        <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          This page isn&apos;t on the map
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-black/55 dark:text-white/55">
          The link may be outdated, or the page moved. Head home, or compare rental cars from trusted
          Tunisian agencies.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[7px] bg-black px-5 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            <Home className="size-4" />
            Home
          </Link>
          <Link
            href="/search"
            className="inline-flex h-11 items-center gap-2 rounded-[7px] border border-black/15 px-5 text-sm font-semibold dark:border-white/15"
          >
            <Search className="size-4" />
            Find a car
          </Link>
        </div>

        <p className="mt-8 text-sm text-black/45 dark:text-white/45">
          Or jump straight to{" "}
          <Link href="/search" className="font-medium underline underline-offset-4">
            /search
          </Link>
          .
        </p>
      </section>
    </PageShell>
  )
}
