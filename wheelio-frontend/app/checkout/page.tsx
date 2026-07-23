import { Suspense } from "react"
import type { Metadata } from "next"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Checkout | Wheelio",
  description:
    "Complete your Tunisia car rental booking. Clear TND totals, extras, and payment choice.",
}

function CheckoutFallback() {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6">
        <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 h-4 w-80 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-10 h-96 rounded-[14px] bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </PageShell>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutForm />
    </Suspense>
  )
}
