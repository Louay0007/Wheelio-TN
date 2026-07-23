import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { COOKIES_DOC } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Cookie policy | Wheelio",
  description: COOKIES_DOC.description,
}

export default function CookiesPage() {
  return <LegalPage doc={COOKIES_DOC} />
}
