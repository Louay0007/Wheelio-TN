"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminSession } from "@/lib/admin-session"

export default function AdminLogoutPage() {
  const { logout } = useAdminSession()
  const router = useRouter()
  useEffect(() => {
    logout()
    router.replace("/admin/login")
  }, [logout, router])
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-100 text-sm dark:bg-zinc-950">
      Signing out…
    </div>
  )
}
