import { cn } from "@/lib/utils"

export function DemoSessionBanner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      className={cn("border-black/10 bg-black/[0.03] text-black/65 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65",
        className,
      )}
    >
      <p className="mx-auto max-w-7xl px-4 py-2.5 text-sm sm:px-6">
        Preview — changes are not saved to a server. Guest checkout still works
        without an account.
      </p>
    </div>
  )
}
