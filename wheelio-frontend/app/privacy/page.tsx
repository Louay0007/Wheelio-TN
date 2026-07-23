import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { PRIVACY_DOC } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Privacy policy | Wheelio",
  description: PRIVACY_DOC.description,
}

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY_DOC} />
}
