import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { getRequestLocale } from "@/lib/i18n/server"
import { getLegalDocument } from "@/server/modules/reviews-content/application/get-legal-document"

export const metadata: Metadata = {
  title: "Cancellation policy | Wheelio",
  description: "How cancellations and refunds work on Wheelio TN.",
}

type PageProps = { searchParams: Promise<{ locale?: string }> }

export default async function CancellationPolicyPage({
  searchParams,
}: PageProps) {
  const locale = await getRequestLocale((await searchParams).locale)
  const document = await getLegalDocument("cancellation-policy", locale)
  return <LegalPage doc={document} locale={locale} />
}
