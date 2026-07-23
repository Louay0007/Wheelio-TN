import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/legal-page"
import { CANCELLATION_DOC } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Cancellation policy | Wheelio",
  description: CANCELLATION_DOC.description,
}

export default function CancellationPolicyPage() {
  return <LegalPage doc={CANCELLATION_DOC} />
}
