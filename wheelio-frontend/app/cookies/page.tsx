import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { getRequestLocale } from "@/lib/i18n/server"
import { getLegalDocument } from "@/server/modules/reviews-content/application/get-legal-document"

export const metadata: Metadata = {
  title: "Cookie policy | Wheelio",
  description: "How Wheelio TN uses cookies and similar technologies.",
}

type PageProps = { searchParams: Promise<{ locale?: string }> }

export default async function CookiesPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale((await searchParams).locale)
  const document = await getLegalDocument("cookies", locale)
  return <LegalPage doc={document} locale={locale} />
}
