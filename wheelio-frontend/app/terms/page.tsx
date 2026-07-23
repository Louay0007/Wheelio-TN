import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { TERMS_DOC } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Terms of service | Wheelio",
  description: TERMS_DOC.description,
}

export default function TermsPage() {
  return <LegalPage doc={TERMS_DOC} />
}
