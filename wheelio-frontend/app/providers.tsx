"use client"

import type { ReactNode } from "react"
import { QueryProvider } from "@/components/providers/query-provider"
import { LocaleProvider } from "@/lib/i18n/locale"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <QueryProvider>{children}</QueryProvider>
    </LocaleProvider>
  )
}
