"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAgencySession } from "@/lib/agency-session"
import { PageShell } from "@/components/page-shell"

export default function AgencyLogoutPage() {
  const { logout } = useAgencySession()
  const router = useRouter()
  useEffect(() => {
    logout()
    router.replace("/agency/login")
  }, [logout, router])
  return (
    <PageShell>
      <p className="p-10 text-center text-sm text-zinc-600 dark:text-zinc-300">Signing out…</p>
    </PageShell>
  )
}
