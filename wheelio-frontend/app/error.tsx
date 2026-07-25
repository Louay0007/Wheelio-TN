"use client"

import { useEffect } from "react"
import { ApiErrorState } from "@/components/api/api-state"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled route error", {
      name: error.name,
      message: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <ApiErrorState error={error} retry={reset} />
    </main>
  )
}
