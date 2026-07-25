"use client"

import { cn } from "@/lib/utils"

type BookingInlineToastProps = {
  message: string | null
  className?: string
}

export function BookingInlineToast({
  message,
  className,
}: BookingInlineToastProps) {
  if (!message) return null

  return (
    <div
      role="status"
      className={cn("fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-[10px] border border-black/15 bg-white px-4 py-3 text-sm font-medium shadow-lg dark:border-white/15 dark:bg-zinc-950",
        className,
      )}
    >
      {message}
    </div>
  )
}
