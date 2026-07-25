"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  variant?: "hero" | "header"
}

export function ThemeToggle({ variant = "hero" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"
  const isHeader = variant === "header"

  return (
    <button
      type="button"
      onClick={() => mounted && setTheme(isDark ? "light" : "dark")}
      className={cn("inline-flex size-10 items-center justify-center rounded-full border backdrop-blur-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        isHeader
          ? "border-black/15 bg-black/[0.03] text-black hover:bg-black/[0.06] focus-visible:outline-black dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1] dark:focus-visible:outline-white"
          : "border-white/25 bg-black/15 text-white hover:border-white/50 hover:bg-black/25 focus-visible:outline-white",
      )}
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Change color theme"}
      title={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Change color theme"}
    >
      {mounted && isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
