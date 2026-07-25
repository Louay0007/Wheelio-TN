import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { getRequestLocale } from "@/lib/i18n/server"
import { getLegalDocument } from "@/server/modules/reviews-content/application/get-legal-document"

export const metadata: Metadata = {
  title: "Terms of service | Wheelio",
  description: "Terms governing use of the Wheelio TN car rental marketplace.",
}

type PageProps = { searchParams: Promise<{ locale?: string }> }

export default async function TermsPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale((await searchParams).locale)
  const document = await getLegalDocument("terms", locale)
  return <LegalPage doc={document} locale={locale} />
}
