import type { Metadata } from "next"
import { Suspense } from "react"
import { VerifyEmailClient } from "./verify-client"

export const metadata: Metadata = {
  title: "Verify email | Wheelio TN",
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient />
    </Suspense>
  )
}
