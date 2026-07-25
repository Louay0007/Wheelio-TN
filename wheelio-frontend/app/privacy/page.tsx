import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { getRequestLocale } from "@/lib/i18n/server"
import { getLegalDocument } from "@/server/modules/reviews-content/application/get-legal-document"

export const metadata: Metadata = {
  title: "Privacy policy | Wheelio",
  description: "How Wheelio TN collects and uses personal data.",
}

type PageProps = { searchParams: Promise<{ locale?: string }> }

export default async function PrivacyPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale((await searchParams).locale)
  const document = await getLegalDocument("privacy", locale)
  return <LegalPage doc={document} locale={locale} />
}
