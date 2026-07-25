import Link from "next/link"
import { PageHero, PageShell } from "@/components/page-shell"
import type { LegalContentDocument } from "@/lib/contracts/content"
import type { AppLocaleDto } from "@/lib/contracts/common"

export function LegalPage({
  doc,
  locale = "en",
}: {
  doc: LegalContentDocument
  locale?: AppLocaleDto
}) {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        title={doc.title}
        description={`Last updated ${formatDate(doc.lastUpdated, locale)}. Official English draft — translations may follow.`}
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-14">
        <aside className="hidden lg:block">
          <nav
            aria-label="On this page"
            className="sticky top-24 space-y-1 border-l border-black/10 pl-4 dark:border-white/10"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
              Contents
            </p>
            {doc.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block py-1.5 text-sm text-black/55 transition hover:text-black dark:text-white/55 dark:hover:text-white"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="max-w-3xl">
          <p className="text-base leading-relaxed text-black/65 dark:text-white/65">
            {doc.intro}
          </p>

          <div className="mt-10 space-y-10">
            {doc.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 pt-8"
              >
                <h2 className="text-xl font-semibold tracking-[-0.03em]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-black/65 dark:text-white/65">
                  {section.paragraphs.map((p) => (
                    <p key={p.slice(0, 48)}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 pt-6 text-sm text-black/45 dark:text-white/45">
            Related:{" "}
            <Link href={`/terms?locale=${locale}`} className="underline-offset-2 hover:underline">
              Terms
            </Link>
            {" · "}
            <Link href={`/privacy?locale=${locale}`} className="underline-offset-2 hover:underline">
              Privacy
            </Link>
            {" · "}
            <Link href={`/cookies?locale=${locale}`} className="underline-offset-2 hover:underline">
              Cookies
            </Link>
            {" · "}
            <Link
              href={`/cancellation-policy?locale=${locale}`}
              className="underline-offset-2 hover:underline"
            >
              Cancellation
            </Link>
            {" · "}
            <Link href="/contact" className="underline-offset-2 hover:underline">
              Contact
            </Link>
          </p>
        </article>
      </div>
    </PageShell>
  )
}

function formatDate(iso: string, locale: AppLocaleDto) {
  return new Date(iso + "T12:00:00").toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
